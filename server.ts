import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { App as FirebaseAdminApp, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth as FirebaseAdminAuth, DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { Firestore as FirebaseAdminFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { Messaging as FirebaseAdminMessaging } from 'firebase-admin/messaging';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

const firebaseConfig = require('./firebase-applet-config.json') as FirebaseAppletConfig;
const PRIMARY_OWNER_EMAIL = 'visionsigma23@gmail.com';
const PORT = Number(process.env.PORT) || 3000;

interface AdminSdkState {
  configured: boolean;
  configSource: string | null;
  missingEnvVars: string[];
  initError: string | null;
  app: FirebaseAdminApp | null;
  auth: FirebaseAdminAuth | null;
  db: FirebaseAdminFirestore | null;
  messaging: FirebaseAdminMessaging | null;
}

function parseServiceAccountFromEnv(): {
  serviceAccount: ServiceAccount | null;
  source: string | null;
  missing: string[];
  error: string | null;
} {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const jsonText = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonText) as ServiceAccount & {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!parsed.client_email && !parsed.clientEmail) {
        return {
          serviceAccount: null,
          source: null,
          missing: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
          error: 'FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email.',
        };
      }
      if (!parsed.private_key && !parsed.privateKey) {
        return {
          serviceAccount: null,
          source: null,
          missing: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
          error: 'FIREBASE_SERVICE_ACCOUNT_JSON is missing private_key.',
        };
      }
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return {
        serviceAccount: parsed,
        source: 'FIREBASE_SERVICE_ACCOUNT_JSON',
        missing: [],
        error: null,
      };
    } catch (err) {
      return {
        serviceAccount: null,
        source: null,
        missing: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
        error: err instanceof Error ? `Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}` : 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON.',
      };
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (clientEmail && privateKey) {
    return {
      serviceAccount: {
        projectId: process.env.FIREBASE_PROJECT_ID?.trim() || firebaseConfig.projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      },
      source: 'FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
      missing: [],
      error: null,
    };
  }

  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (gacPath && fs.existsSync(gacPath)) {
    try {
      const fileContent = fs.readFileSync(gacPath, 'utf8');
      const parsed = JSON.parse(fileContent) as ServiceAccount;
      return {
        serviceAccount: parsed,
        source: 'GOOGLE_APPLICATION_CREDENTIALS',
        missing: [],
        error: null,
      };
    } catch (err) {
      return {
        serviceAccount: null,
        source: null,
        missing: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
        error: err instanceof Error ? err.message : 'Unable to parse GOOGLE_APPLICATION_CREDENTIALS file.',
      };
    }
  }

  const missing: string[] = ['FIREBASE_SERVICE_ACCOUNT_JSON'];
  if (clientEmail && !privateKey) {
    missing.splice(0, missing.length, 'FIREBASE_PRIVATE_KEY');
  } else if (!clientEmail && privateKey) {
    missing.splice(0, missing.length, 'FIREBASE_CLIENT_EMAIL');
  }

  return {
    serviceAccount: null,
    source: null,
    missing,
    error: null,
  };
}

function initAdminSdk(): AdminSdkState {
  const parsed = parseServiceAccountFromEnv();
  if (!parsed.serviceAccount) {
    return {
      configured: false,
      configSource: null,
      missingEnvVars: parsed.missing,
      initError: parsed.error,
      app: null,
      auth: null,
      db: null,
      messaging: null,
    };
  }

  try {
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert(parsed.serviceAccount),
            projectId: firebaseConfig.projectId,
          });
    const auth = getAuth(app);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    const messaging = getMessaging(app);

    return {
      configured: true,
      configSource: parsed.source,
      missingEnvVars: [],
      initError: null,
      app,
      auth,
      db,
      messaging,
    };
  } catch (err) {
    return {
      configured: false,
      configSource: parsed.source,
      missingEnvVars: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
      initError: err instanceof Error ? err.message : 'Firebase Admin SDK initialization failed.',
      app: null,
      auth: null,
      db: null,
      messaging: null,
    };
  }
}

const adminState = initAdminSdk();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function resolveRequestOrigin(req: Request): string {
  const configuredOrigin = process.env.APP_URL?.trim();
  if (configuredOrigin && configuredOrigin !== 'MY_APP_URL') {
    return configuredOrigin.replace(/\/+$/, '');
  }
  const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = req.get('host');
  if (host) {
    return `${proto}://${host}`;
  }
  return `http://localhost:${PORT}`;
}

function sanitizeDestinationPath(rawUrl: string | undefined, origin: string): {
  relativePath: string;
  absoluteUrl: string;
} {
  const fallback = '/shop';
  const input = (rawUrl || fallback).trim() || fallback;
  try {
    const parsed = new URL(input, origin);
    if (parsed.origin === origin) {
      const rel = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
      return {
        relativePath: rel.slice(0, 300),
        absoluteUrl: `${origin}${rel}`,
      };
    }
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return {
        relativePath: parsed.href.slice(0, 300),
        absoluteUrl: parsed.href.slice(0, 500),
      };
    }
  } catch {
    // Fall back safely below
  }
  return {
    relativePath: fallback,
    absoluteUrl: `${origin}${fallback}`,
  };
}

function sanitizeImageUrl(rawImageUrl: string | undefined, origin: string): {
  valid: boolean;
  storedValue: string;
  absoluteUrl?: string;
  error?: string;
} {
  const trimmed = (rawImageUrl || '').trim();
  if (!trimmed) {
    return { valid: true, storedValue: '' };
  }
  if (trimmed.startsWith('data:')) {
    return {
      valid: false,
      storedValue: '',
      error: 'Base64 data URLs cannot be delivered directly in Web Push payloads. Please upload the image file or use a hosted HTTPS URL.',
    };
  }
  if (trimmed.startsWith('media:')) {
    return {
      valid: false,
      storedValue: '',
      error: 'Internal media keys must be resolved or uploaded as a public URL before sending.',
    };
  }
  if (trimmed.startsWith('/')) {
    return {
      valid: true,
      storedValue: trimmed.slice(0, 500),
      absoluteUrl: `${origin}${trimmed}`,
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return {
        valid: true,
        storedValue: parsed.href.slice(0, 500),
        absoluteUrl: parsed.href.slice(0, 500),
      };
    }
  } catch {
    // Invalid URL
  }
  return {
    valid: false,
    storedValue: '',
    error: 'Notification image URL must start with https:// or /.',
  };
}

interface AuthenticatedAdminRequest extends Request {
  adminUser?: DecodedIdToken;
}

async function requireAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!adminState.configured || !adminState.auth || !adminState.db) {
    res.status(503).json({
      error: 'Firebase Admin SDK is not configured on the server.',
      missingEnvVars: adminState.missingEnvVars,
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Missing Authorization Bearer token.' });
    return;
  }

  try {
    const decoded = await adminState.auth.verifyIdToken(match[1]);
    if (!decoded.email_verified) {
      res.status(403).json({ error: 'Verified email is required for admin operations.' });
      return;
    }

    const isPrimary = decoded.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
    if (!isPrimary) {
      const adminDoc = await adminState.db.collection('admins').doc(decoded.uid).get();
      if (!adminDoc.exists) {
        res.status(403).json({ error: 'Administrator privileges required.' });
        return;
      }
    }

    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // Public Push Configuration Health Check (never returns secret values)
  app.get('/api/push/status', (_req: Request, res: Response) => {
    res.json({
      adminSdkReady: adminState.configured,
      configSource: adminState.configSource,
      missingServerEnvVars: adminState.missingEnvVars,
      initError: adminState.initError,
      vapidConfiguredInProcessEnv: Boolean(process.env.VITE_FIREBASE_VAPID_KEY?.trim()),
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    });
  });

  // Register or refresh an FCM browser/PWA subscription token
  app.post('/api/push/subscribe', async (req: Request, res: Response) => {
    const { token, platform, userAgent } = (req.body || {}) as {
      token?: unknown;
      platform?: unknown;
      userAgent?: unknown;
    };

    if (typeof token !== 'string' || token.trim().length < 20 || token.trim().length > 512) {
      res.status(400).json({ error: 'A valid FCM registration token is required.' });
      return;
    }

    if (!adminState.configured || !adminState.db) {
      res.status(503).json({
        code: 'ADMIN_SDK_UNCONFIGURED',
        error: 'Firebase Admin SDK is not configured on the server.',
        missingServerEnvVars: adminState.missingEnvVars,
      });
      return;
    }

    const cleanToken = token.trim();
    const subscriptionId = hashToken(cleanToken);
    const cleanPlatform =
      typeof platform === 'string' && platform.trim() ? platform.trim().slice(0, 64) : 'Web';
    const cleanUserAgent =
      typeof userAgent === 'string' && userAgent.trim() ? userAgent.trim().slice(0, 256) : '';

    try {
      const ref = adminState.db.collection('pushSubscriptions').doc(subscriptionId);
      const existingSnap = await ref.get();
      if (existingSnap.exists) {
        await ref.update({
          status: 'active',
          platform: cleanPlatform,
          userAgent: cleanUserAgent,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          token: cleanToken,
          platform: cleanPlatform,
          userAgent: cleanUserAgent,
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      res.json({ ok: true, subscriptionId, storedVia: 'server' });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to store push subscription.',
      });
    }
  });

  // Disable / unsubscribe a device token
  app.post('/api/push/unsubscribe', async (req: Request, res: Response) => {
    const { token } = (req.body || {}) as { token?: unknown };
    if (typeof token !== 'string' || token.trim().length < 20 || token.trim().length > 512) {
      res.status(400).json({ error: 'A valid FCM token is required to unsubscribe.' });
      return;
    }

    if (!adminState.configured || !adminState.db) {
      res.status(503).json({
        code: 'ADMIN_SDK_UNCONFIGURED',
        error: 'Firebase Admin SDK is not configured on the server.',
      });
      return;
    }

    const subscriptionId = hashToken(token.trim());
    try {
      const ref = adminState.db.collection('pushSubscriptions').doc(subscriptionId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          status: 'disabled',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      res.json({ ok: true, subscriptionId });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update subscription status.',
      });
    }
  });

  // Upload a compressed notification image so Web Push notifications get a real HTTPS URL
  app.post('/api/push/upload-image', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    if (!adminState.db) {
      res.status(503).json({ error: 'Admin database not ready.' });
      return;
    }

    const { dataUrl } = (req.body || {}) as { dataUrl?: unknown };
    if (typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Image dataUrl is required.' });
      return;
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      res.status(400).json({ error: 'Only JPEG, PNG, or WebP images are supported.' });
      return;
    }

    const mimeType = match[1];
    const dataBase64 = match[2];
    if (dataBase64.length > 350000) {
      res.status(400).json({ error: 'Uploaded notification image is too large (max ~250KB).' });
      return;
    }

    try {
      const mediaId = `notif-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
      await adminState.db.collection('notificationMedia').doc(mediaId).set({
        mimeType,
        dataBase64,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({
        ok: true,
        mediaId,
        imageUrl: `/api/push/media/${mediaId}`,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to store notification image.',
      });
    }
  });

  // Publicly serve hosted notification media for OS push banners
  app.get('/api/push/media/:mediaId', async (req: Request, res: Response) => {
    const mediaId = req.params.mediaId || '';
    if (!/^[a-zA-Z0-9_\-]+$/.test(mediaId)) {
      res.status(400).send('Invalid media ID.');
      return;
    }
    if (!adminState.configured || !adminState.db) {
      res.status(503).send('Media service unavailable.');
      return;
    }

    try {
      const snap = await adminState.db.collection('notificationMedia').doc(mediaId).get();
      if (!snap.exists) {
        res.status(404).send('Image not found.');
        return;
      }
      const data = snap.data() as { mimeType?: string; dataBase64?: string } | undefined;
      if (!data?.dataBase64 || !data?.mimeType) {
        res.status(404).send('Invalid media record.');
        return;
      }

      const buffer = Buffer.from(data.dataBase64, 'base64');
      res.setHeader('Content-Type', data.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch {
      res.status(500).send('Unable to retrieve image.');
    }
  });

  // Admin broadcast endpoint: delivers real FCM push messages and logs results
  app.post('/api/push/send', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
    if (!adminState.db || !adminState.messaging) {
      res.status(503).json({
        error: 'Firebase Admin SDK is not configured on the server.',
        missingServerEnvVars: adminState.missingEnvVars,
      });
      return;
    }

    const body = (req.body || {}) as {
      title?: unknown;
      message?: unknown;
      category?: unknown;
      imageUrl?: unknown;
      destinationUrl?: unknown;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const category =
      typeof body.category === 'string' &&
      ['new_arrival', 'special_offer', 'collection', 'announcement'].includes(body.category)
        ? (body.category as 'new_arrival' | 'special_offer' | 'collection' | 'announcement')
        : 'announcement';

    if (!title || title.length > 100) {
      res.status(400).json({ error: 'Notification title must be between 1 and 100 characters.' });
      return;
    }
    if (!message || message.length > 300) {
      res.status(400).json({ error: 'Notification message must be between 1 and 300 characters.' });
      return;
    }

    const origin = resolveRequestOrigin(req);
    const dest = sanitizeDestinationPath(
      typeof body.destinationUrl === 'string' ? body.destinationUrl : undefined,
      origin
    );
    const imgCheck = sanitizeImageUrl(
      typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      origin
    );
    if (!imgCheck.valid) {
      res.status(400).json({ error: imgCheck.error });
      return;
    }

    try {
      const subSnap = await adminState.db
        .collection('pushSubscriptions')
        .where('status', '==', 'active')
        .get();

      const docs = subSnap.docs
        .map((d) => ({
          id: d.id,
          token: (d.data().token as string | undefined) || '',
        }))
        .filter((item) => item.token.length >= 20);

      if (docs.length === 0) {
        res.status(400).json({
          error: 'No active push notification subscribers found yet.',
        });
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      const invalidDocIds: string[] = [];

      const BATCH_SIZE = 500;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const tokens = chunk.map((c) => c.token);

        const multicastResponse = await adminState.messaging.sendEachForMulticast({
          tokens,
          notification: {
            title,
            body: message,
            ...(imgCheck.absoluteUrl ? { imageUrl: imgCheck.absoluteUrl } : {}),
          },
          data: {
            title,
            body: message,
            category,
            url: dest.relativePath,
            ...(imgCheck.absoluteUrl ? { imageUrl: imgCheck.absoluteUrl } : {}),
          },
          webpush: {
            headers: {
              Urgency: 'high',
              TTL: '86400',
            },
            notification: {
              title,
              body: message,
              icon: `${origin}/pwa-192x192.png`,
              badge: `${origin}/pwa-192x192.png`,
              ...(imgCheck.absoluteUrl ? { image: imgCheck.absoluteUrl } : {}),
              tag: `antiker-${category}`,
            },
            fcmOptions: {
              link: dest.absoluteUrl,
            },
          },
        });

        successCount += multicastResponse.successCount;
        failureCount += multicastResponse.failureCount;

        multicastResponse.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidDocIds.push(chunk[idx].id);
            }
          }
        });
      }

      // Prune invalid or expired device tokens automatically
      if (invalidDocIds.length > 0) {
        const deleteBatch = adminState.db.batch();
        for (const id of invalidDocIds) {
          deleteBatch.delete(adminState.db.collection('pushSubscriptions').doc(id));
        }
        await deleteBatch.commit();
      }

      const status: 'sent' | 'partial' | 'failed' =
        successCount === 0 ? 'failed' : failureCount > 0 ? 'partial' : 'sent';

      const notificationId = `push-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      await adminState.db
        .collection('notifications')
        .doc(notificationId)
        .set({
          title: title.slice(0, 100),
          message: message.slice(0, 300),
          category,
          imageUrl: imgCheck.storedValue,
          destinationUrl: dest.relativePath,
          targetCount: docs.length,
          successCount,
          failureCount,
          prunedCount: invalidDocIds.length,
          status,
          sentByEmail: (req.adminUser?.email || PRIMARY_OWNER_EMAIL).slice(0, 150),
          createdAt: FieldValue.serverTimestamp(),
        });

      res.json({
        ok: true,
        notificationId,
        targetCount: docs.length,
        successCount,
        failureCount,
        prunedCount: invalidDocIds.length,
        status,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to send push notification broadcast.',
      });
    }
  });

  // Mount Vite dev middleware or serve built static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ANTIKER server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
