import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { db, firebaseApp, handleFirestoreError, OperationType } from '../firebase';
import type { ForegroundPushPayload, PushNotificationCategory } from '../types';

const STORAGE_TOKEN_KEY = 'antiker_fcm_token';
const STORAGE_PROMPT_DISMISSED_KEY = 'antiker_push_prompt_dismissed';

export function getConfiguredVapidKey(): string {
  return (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
}

export function isVapidConfigured(): boolean {
  return getConfiguredVapidKey().length > 0;
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  );
}

export function hasBasicPushApis(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function getBrowserPermission(): NotificationPermission | 'unsupported' {
  if (!hasBasicPushApis()) return 'unsupported';
  return Notification.permission;
}

export function getSavedFcmToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSavedFcmToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function isPromptDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_PROMPT_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPromptDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(STORAGE_PROMPT_DISMISSED_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_PROMPT_DISMISSED_KEY);
    }
  } catch {
    // Ignore
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function detectPlatformLabel(): string {
  const mode = isStandalonePwa() ? 'PWA' : 'Web';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iPhone|iPad|iPod/i.test(ua)) return `iOS ${mode}`;
  if (/Android/i.test(ua)) return `Android ${mode}`;
  if (/Mac/i.test(ua)) return `macOS ${mode}`;
  if (/Windows/i.test(ua)) return `Windows ${mode}`;
  return `Desktop ${mode}`;
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing && existing.active?.scriptURL.endsWith('/firebase-messaging-sw.js')) {
    await existing.update().catch(() => undefined);
    return existing;
  }
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function subscribeDeviceToPush(): Promise<{
  token: string;
  subscriptionId: string;
}> {
  if (!hasBasicPushApis()) {
    throw new Error('Web Push notifications are not supported on this browser.');
  }

  if (isIosDevice() && !isStandalonePwa()) {
    throw new Error(
      'On iPhone and iPad, tap Share → Add to Home Screen first, then open ANTIKER from your Home Screen to enable notifications.'
    );
  }

  const vapidKey = getConfiguredVapidKey();
  if (!vapidKey) {
    throw new Error(
      'Web Push VAPID key (VITE_FIREBASE_VAPID_KEY) is not configured yet.'
    );
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Firebase Cloud Messaging is not supported in this browser context.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked in your browser settings. Please allow notifications for this site to subscribe.'
        : 'Notification permission request was dismissed.'
    );
  }

  const swReg = await registerMessagingServiceWorker();
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swReg,
  });

  if (!token) {
    throw new Error('Unable to generate an FCM registration token.');
  }

  const subscriptionId = await sha256Hex(token);
  const platform = detectPlatformLabel();
  const userAgent = (navigator.userAgent || '').slice(0, 256);

  // Primary registration via secure backend API (prevents duplicates via SHA-256 doc ID)
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform, userAgent }),
  });

  if (response.ok) {
    setSavedFcmToken(token);
    return { token, subscriptionId };
  }

  // If server Firebase Admin SDK is not yet configured, fallback to strict-rules Firestore write
  const errData = (await response.json().catch(() => ({}))) as {
    code?: string;
    error?: string;
  };
  if (errData.code === 'ADMIN_SDK_UNCONFIGURED') {
    try {
      await setDoc(doc(db, 'pushSubscriptions', subscriptionId), {
        token: token.slice(0, 512),
        platform: platform.slice(0, 64),
        userAgent,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSavedFcmToken(token);
      return { token, subscriptionId };
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.WRITE, `pushSubscriptions/${subscriptionId}`);
    }
  }

  throw new Error(errData.error || 'Failed to save notification subscription.');
}

export async function unsubscribeDeviceFromPush(currentToken: string | null): Promise<void> {
  const token = currentToken || getSavedFcmToken();

  try {
    const supported = await isSupported();
    if (supported && hasBasicPushApis()) {
      const messaging = getMessaging(firebaseApp);
      await deleteToken(messaging).catch(() => false);
    }
  } catch {
    // Continue backend cleanup even if local token deletion fails
  }

  if (token) {
    const res = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { code?: string };
      if (errData.code === 'ADMIN_SDK_UNCONFIGURED') {
        const subId = await sha256Hex(token);
        await setDoc(
          doc(db, 'pushSubscriptions', subId),
          {
            token: token.slice(0, 512),
            platform: detectPlatformLabel(),
            userAgent: (navigator.userAgent || '').slice(0, 256),
            status: 'disabled',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => undefined);
      }
    }
  }

  setSavedFcmToken(null);
}

export async function subscribeForegroundMessages(
  onReceive: (payload: ForegroundPushPayload) => void
): Promise<() => void> {
  if (!hasBasicPushApis()) {
    return () => {};
  }
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return () => {};
  }

  const messaging = getMessaging(firebaseApp);
  const unsub = onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || 'ANTIKER';
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      'A new curated update from ANTIKER.';
    const imageUrl = payload.notification?.image || payload.data?.imageUrl || undefined;
    const url = payload.data?.url || payload.fcmOptions?.link || '/shop';
    const rawCat = payload.data?.category || 'announcement';
    const category: PushNotificationCategory =
      rawCat === 'new_arrival' ||
      rawCat === 'special_offer' ||
      rawCat === 'collection'
        ? rawCat
        : 'announcement';

    onReceive({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      imageUrl,
      url,
      category,
    });
  });

  return unsub;
}
