import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  PRIMARY_OWNER_EMAIL,
} from '../firebase';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_SITE_SETTINGS } from '../data/defaults';
import {
  AvailabilityStatus,
  Category,
  ContactInquiry,
  ForegroundPushPayload,
  Product,
  PushNotificationCategory,
  PushNotificationRecord,
  PushServerStatus,
  PushSubscriptionRecord,
  SiteSettings,
} from '../types';
import { slugify } from '../utils/whatsapp';
import {
  getBrowserPermission,
  getSavedFcmToken,
  hasBasicPushApis,
  isIosDevice,
  isStandalonePwa,
  isVapidConfigured,
  subscribeDeviceToPush,
  subscribeForegroundMessages,
  unsubscribeDeviceFromPush,
} from '../utils/pushNotifications';

interface StoreContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminCheckDone: boolean;
  isDbInitialized: boolean;
  loadingCatalog: boolean;
  catalogError: string | null;
  categories: Category[];
  products: Product[];
  siteSettings: SiteSettings;
  inquiries: ContactInquiry[];
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  bootstrapDatabase: () => Promise<void>;
  applySamplePkrPricing: () => Promise<void>;
  saveProduct: (
    input: {
      name: string;
      categoryId: string;
      price: number;
      description: string;
      details: string[];
      availability: AvailabilityStatus;
      featured: boolean;
      bestSeller: boolean;
      images: string[];
      sortOrder: number;
    },
    existingId?: string
  ) => Promise<string>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (
    input: {
      name: string;
      slug: string;
      description: string;
      image: string;
      sortOrder: number;
    },
    existingId?: string
  ) => Promise<string>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveSiteSettings: (input: Omit<SiteSettings, 'updatedAt'>) => Promise<void>;
  submitContactInquiry: (input: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => Promise<void>;
  markInquiryReviewed: (inquiryId: string) => Promise<void>;
  deleteInquiry: (inquiryId: string) => Promise<void>;
  // Web Push Notifications
  pushSupported: boolean;
  vapidConfigured: boolean;
  iosNeedsInstall: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  isPushSubscribed: boolean;
  pushBusy: boolean;
  pushServerStatus: PushServerStatus | null;
  activeSubscriberCount: number;
  totalSubscriberCount: number;
  pushHistory: PushNotificationRecord[];
  foregroundToast: ForegroundPushPayload | null;
  dismissForegroundToast: () => void;
  refreshPushServerStatus: () => Promise<void>;
  enablePushNotifications: () => Promise<void>;
  disablePushNotifications: () => Promise<void>;
  uploadPushNotificationImage: (dataUrl: string) => Promise<string>;
  sendPushNotification: (input: {
    title: string;
    message: string;
    category: PushNotificationCategory;
    imageUrl?: string;
    destinationUrl: string;
  }) => Promise<{
    notificationId: string;
    targetCount: number;
    successCount: number;
    failureCount: number;
    prunedCount: number;
    status: 'sent' | 'partial' | 'failed';
  }>;
  deletePushHistoryItem: (notificationId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbSettings, setDbSettings] = useState<SiteSettings | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [pushSubscriptions, setPushSubscriptions] = useState<PushSubscriptionRecord[]>([]);
  const [pushHistory, setPushHistory] = useState<PushNotificationRecord[]>([]);
  const [pushServerStatus, setPushServerStatus] = useState<PushServerStatus | null>(null);

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getBrowserPermission()
  );
  const [currentFcmToken, setCurrentFcmToken] = useState<string | null>(() => getSavedFcmToken());
  const [pushBusy, setPushBusy] = useState(false);
  const [foregroundToast, setForegroundToast] = useState<ForegroundPushPayload | null>(null);

  const pushSupported = useMemo(() => hasBasicPushApis(), []);
  const vapidConfigured = useMemo(() => isVapidConfigured(), []);
  const iosNeedsInstall = useMemo(() => isIosDevice() && !isStandalonePwa(), []);
  const isPushSubscribed = Boolean(currentFcmToken) && pushPermission === 'granted';

  const refreshPushServerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/push/status');
      if (res.ok) {
        const data = (await res.json()) as PushServerStatus;
        setPushServerStatus(data);
      }
    } catch {
      // Ignore transient network errors when server status is unavailable
    }
  }, []);

  useEffect(() => {
    void refreshPushServerStatus();
  }, [refreshPushServerStatus]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    if (pushSupported && pushPermission === 'granted') {
      void subscribeForegroundMessages((payload) => {
        if (active) {
          setForegroundToast(payload);
        }
      }).then((unsub) => {
        if (active) {
          cleanup = unsub;
        } else {
          unsub();
        }
      });
    }

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, [pushSupported, pushPermission]);

  // Auth & Admin Role Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser || !currentUser.emailVerified) {
        setIsAdmin(false);
        setAdminCheckDone(true);
        return;
      }

      if (currentUser.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        setAdminCheckDone(true);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminCheckDone(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Public Storefront Subscriptions
  useEffect(() => {
    const settingsRef = doc(db, 'siteSettings', 'main');
    const unsubSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDbSettings(snapshot.data() as SiteSettings);
          setIsDbInitialized(true);
        } else {
          setDbSettings(null);
          setIsDbInitialized(false);
        }
        setSettingsLoaded(true);
      },
      (error) => {
        setSettingsLoaded(true);
        setCatalogError('Unable to load storefront configuration.');
        handleFirestoreError(error, OperationType.GET, 'siteSettings/main');
      }
    );

    const catQuery = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsubCategories = onSnapshot(
      catQuery,
      (snapshot) => {
        const list: Category[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Category, 'id'>),
          id: d.id,
        }));
        setDbCategories(list);
        setCategoriesLoaded(true);
      },
      (error) => {
        setCategoriesLoaded(true);
        setCatalogError('Unable to load product categories.');
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    const prodQuery = query(collection(db, 'products'), orderBy('sortOrder', 'asc'));
    const unsubProducts = onSnapshot(
      prodQuery,
      (snapshot) => {
        const list: Product[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Product, 'id'>),
          id: d.id,
        }));
        setDbProducts(list);
        setProductsLoaded(true);
      },
      (error) => {
        setProductsLoaded(true);
        setCatalogError('Unable to load product catalog.');
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    return () => {
      unsubSettings();
      unsubCategories();
      unsubProducts();
    };
  }, []);

  // Admin-only Inquiries, Push Subscribers & Notification History Listeners
  useEffect(() => {
    if (!authReady || !adminCheckDone || !isAdmin) {
      setInquiries([]);
      setPushSubscriptions([]);
      setPushHistory([]);
      return;
    }

    const inqQuery = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubInquiries = onSnapshot(
      inqQuery,
      (snapshot) => {
        const list: ContactInquiry[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<ContactInquiry, 'id'>),
          id: d.id,
        }));
        setInquiries(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inquiries');
      }
    );

    const subQuery = query(collection(db, 'pushSubscriptions'));
    const unsubSubs = onSnapshot(
      subQuery,
      (snapshot) => {
        const list: PushSubscriptionRecord[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<PushSubscriptionRecord, 'id'>),
          id: d.id,
        }));
        setPushSubscriptions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'pushSubscriptions');
      }
    );

    const notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snapshot) => {
        const list: PushNotificationRecord[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<PushNotificationRecord, 'id'>),
          id: d.id,
        }));
        setPushHistory(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubInquiries();
      unsubSubs();
      unsubNotifs();
    };
  }, [authReady, adminCheckDone, isAdmin]);

  const categories = useMemo(() => {
    if (isDbInitialized || dbCategories.length > 0) {
      return dbCategories;
    }
    return DEFAULT_CATEGORIES;
  }, [isDbInitialized, dbCategories]);

  const products = useMemo(() => {
    if (isDbInitialized || dbProducts.length > 0) {
      return dbProducts;
    }
    return DEFAULT_PRODUCTS;
  }, [isDbInitialized, dbProducts]);

  const siteSettings = useMemo(() => {
    return dbSettings ?? DEFAULT_SITE_SETTINGS;
  }, [dbSettings]);

  const loadingCatalog = !(categoriesLoaded && productsLoaded && settingsLoaded);

  const signInWithGoogle = useCallback(async () => {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const bootstrapDatabase = useCallback(async () => {
    if (!isAdmin) {
      throw new Error('Administrator authentication is required.');
    }

    const batch = writeBatch(db);
    const now = serverTimestamp();

    const settingsPayload = {
      brandName: DEFAULT_SITE_SETTINGS.brandName,
      heroHeadline: DEFAULT_SITE_SETTINGS.heroHeadline,
      heroSubtitle: DEFAULT_SITE_SETTINGS.heroSubtitle,
      promoTitle: DEFAULT_SITE_SETTINGS.promoTitle,
      promoSubtitle: DEFAULT_SITE_SETTINGS.promoSubtitle,
      promoCtaText: DEFAULT_SITE_SETTINGS.promoCtaText,
      aboutTitle: DEFAULT_SITE_SETTINGS.aboutTitle,
      aboutBody: DEFAULT_SITE_SETTINGS.aboutBody,
      whatsappNumber: DEFAULT_SITE_SETTINGS.whatsappNumber,
      phoneDisplay: DEFAULT_SITE_SETTINGS.phoneDisplay,
      emailDisplay: DEFAULT_SITE_SETTINGS.emailDisplay,
      addressDisplay: DEFAULT_SITE_SETTINGS.addressDisplay,
      instagramHandle: DEFAULT_SITE_SETTINGS.instagramHandle,
      facebookUrl: DEFAULT_SITE_SETTINGS.facebookUrl,
      pinterestUrl: DEFAULT_SITE_SETTINGS.pinterestUrl,
      currencySymbol: DEFAULT_SITE_SETTINGS.currencySymbol,
      updatedAt: now,
    };
    batch.set(doc(db, 'siteSettings', 'main'), settingsPayload);

    for (const cat of DEFAULT_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.id), {
        name: cat.name.slice(0, 60),
        slug: cat.slug.slice(0, 64),
        description: cat.description.slice(0, 300),
        image: cat.image.slice(0, 300000),
        sortOrder: cat.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const prod of DEFAULT_PRODUCTS) {
      batch.set(doc(db, 'products', prod.id), {
        name: prod.name.slice(0, 120),
        categoryId: prod.categoryId.slice(0, 64),
        categoryName: prod.categoryName.slice(0, 80),
        price: Math.max(0, Number(prod.price) || 0),
        description: prod.description.slice(0, 2000),
        details: prod.details.slice(0, 10).map((d) => d.slice(0, 240)),
        availability: prod.availability,
        featured: Boolean(prod.featured),
        bestSeller: Boolean(prod.bestSeller),
        images: prod.images.slice(0, 4).map((img) => img.slice(0, 300000)),
        sortOrder: prod.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteSettings/main');
    }
  }, [isAdmin]);

  const applySamplePkrPricing = useCallback(async () => {
    if (!isAdmin) {
      throw new Error('Administrator authentication is required.');
    }

    const batch = writeBatch(db);
    const now = serverTimestamp();

    if (isDbInitialized) {
      batch.update(doc(db, 'siteSettings', 'main'), {
        currencySymbol: 'PKR',
        updatedAt: now,
      });
    }

    for (const prod of dbProducts) {
      if (!prod.price || prod.price <= 0) {
        const defaultMatch = DEFAULT_PRODUCTS.find((d) => d.id === prod.id);
        const samplePrice = defaultMatch ? defaultMatch.price : 15000;
        batch.update(doc(db, 'products', prod.id), {
          price: samplePrice,
          updatedAt: now,
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  }, [isAdmin, isDbInitialized, dbProducts]);

  const saveProduct = useCallback(
    async (
      input: {
        name: string;
        categoryId: string;
        price: number;
        description: string;
        details: string[];
        availability: AvailabilityStatus;
        featured: boolean;
        bestSeller: boolean;
        images: string[];
        sortOrder: number;
      },
      existingId?: string
    ): Promise<string> => {
      if (!isAdmin) {
        throw new Error('Administrator authentication is required.');
      }

      const targetCategory = categories.find((c) => c.id === input.categoryId);
      if (!targetCategory) {
        throw new Error('Please select a valid category.');
      }

      const cleanImages = input.images
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 4)
        .map((s) => s.slice(0, 300000));

      if (cleanImages.length === 0) {
        throw new Error('At least one product image is required.');
      }

      const cleanDetails = input.details
        .map((d) => d.trim())
        .filter((d) => d.length > 0)
        .slice(0, 10)
        .map((d) => d.slice(0, 240));

      const docId = existingId || `${slugify(input.name).slice(0, 45)}-${Date.now().toString(36)}`;
      const docRef = doc(db, 'products', docId);
      const now = serverTimestamp();

      const basePayload = {
        name: input.name.trim().slice(0, 120),
        categoryId: targetCategory.id.slice(0, 64),
        categoryName: targetCategory.name.trim().slice(0, 80),
        price: Math.max(0, Math.min(100000000, Number(input.price) || 0)),
        description: input.description.trim().slice(0, 2000),
        details: cleanDetails,
        availability: input.availability,
        featured: Boolean(input.featured),
        bestSeller: Boolean(input.bestSeller),
        images: cleanImages,
        sortOrder: Math.max(0, Math.min(10000, Math.round(Number(input.sortOrder) || 0))),
        updatedAt: now,
      };

      try {
        if (existingId) {
          await updateDoc(docRef, basePayload);
        } else {
          await setDoc(docRef, {
            ...basePayload,
            createdAt: now,
          });
        }
        return docId;
      } catch (error) {
        handleFirestoreError(
          error,
          existingId ? OperationType.UPDATE : OperationType.CREATE,
          `products/${docId}`
        );
      }
    },
    [isAdmin, categories]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!isAdmin) {
        throw new Error('Administrator authentication is required.');
      }
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
      }
    },
    [isAdmin]
  );

  const saveCategory = useCallback(
    async (
      input: {
        name: string;
        slug: string;
        description: string;
        image: string;
        sortOrder: number;
      },
      existingId?: string
    ): Promise<string> => {
      if (!isAdmin) {
        throw new Error('Administrator authentication is required.');
      }

      const cleanSlug = slugify(input.slug || input.name).slice(0, 64);
      const docId = existingId || cleanSlug;
      const docRef = doc(db, 'categories', docId);
      const now = serverTimestamp();

      const basePayload = {
        name: input.name.trim().slice(0, 60),
        slug: cleanSlug,
        description: input.description.trim().slice(0, 300),
        image: input.image.trim().slice(0, 300000),
        sortOrder: Math.max(0, Math.min(10000, Math.round(Number(input.sortOrder) || 0))),
        updatedAt: now,
      };

      try {
        if (existingId) {
          const batch = writeBatch(db);
          batch.update(docRef, basePayload);
          const affectedProducts = dbProducts.filter((p) => p.categoryId === existingId);
          for (const prod of affectedProducts) {
            if (prod.categoryName !== basePayload.name) {
              batch.update(doc(db, 'products', prod.id), {
                categoryName: basePayload.name.slice(0, 80),
                updatedAt: now,
              });
            }
          }
          await batch.commit();
        } else {
          await setDoc(docRef, {
            ...basePayload,
            createdAt: now,
          });
        }
        return docId;
      } catch (error) {
        handleFirestoreError(
          error,
          existingId ? OperationType.UPDATE : OperationType.CREATE,
          `categories/${docId}`
        );
      }
    },
    [isAdmin, dbProducts]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (!isAdmin) {
        throw new Error('Administrator authentication is required.');
      }
      const inUse = dbProducts.some((p) => p.categoryId === categoryId);
      if (inUse) {
        throw new Error(
          'This category still contains products. Reassign or remove those products first.'
        );
      }
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
      }
    },
    [isAdmin, dbProducts]
  );

  const saveSiteSettings = useCallback(
    async (input: Omit<SiteSettings, 'updatedAt'>) => {
      if (!isAdmin) {
        throw new Error('Administrator authentication is required.');
      }

      const payload = {
        brandName: (input.brandName || 'ANTIKER').trim().slice(0, 40),
        heroHeadline: input.heroHeadline.trim().slice(0, 140),
        heroSubtitle: input.heroSubtitle.trim().slice(0, 400),
        promoTitle: input.promoTitle.trim().slice(0, 140),
        promoSubtitle: input.promoSubtitle.trim().slice(0, 400),
        promoCtaText: input.promoCtaText.trim().slice(0, 60),
        aboutTitle: input.aboutTitle.trim().slice(0, 140),
        aboutBody: input.aboutBody.trim().slice(0, 2000),
        whatsappNumber: input.whatsappNumber.trim().slice(0, 30),
        phoneDisplay: input.phoneDisplay.trim().slice(0, 60),
        emailDisplay: input.emailDisplay.trim().slice(0, 120),
        addressDisplay: input.addressDisplay.trim().slice(0, 240),
        instagramHandle: input.instagramHandle.trim().slice(0, 80),
        facebookUrl: input.facebookUrl.trim().slice(0, 200),
        pinterestUrl: input.pinterestUrl.trim().slice(0, 200),
        currencySymbol: (input.currencySymbol || '$').trim().slice(0, 8),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'siteSettings', 'main'), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'siteSettings/main');
      }
    },
    [isAdmin]
  );

  const submitContactInquiry = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    }) => {
      const id = `inq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        name: input.name.trim().slice(0, 100),
        email: input.email.trim().slice(0, 150),
        phone: input.phone.trim().slice(0, 40),
        subject: input.subject.trim().slice(0, 150),
        message: input.message.trim().slice(0, 2000),
        status: 'new',
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'inquiries', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `inquiries/${id}`);
      }
    },
    []
  );

  const markInquiryReviewed = useCallback(
    async (inquiryId: string) => {
      if (!isAdmin) return;
      try {
        await updateDoc(doc(db, 'inquiries', inquiryId), { status: 'reviewed' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `inquiries/${inquiryId}`);
      }
    },
    [isAdmin]
  );

  const deleteInquiry = useCallback(
    async (inquiryId: string) => {
      if (!isAdmin) return;
      try {
        await deleteDoc(doc(db, 'inquiries', inquiryId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `inquiries/${inquiryId}`);
      }
    },
    [isAdmin]
  );

  const enablePushNotifications = useCallback(async () => {
    setPushBusy(true);
    try {
      const { token } = await subscribeDeviceToPush();
      setCurrentFcmToken(token);
      setPushPermission(getBrowserPermission());
    } catch (error) {
      setPushPermission(getBrowserPermission());
      throw error;
    } finally {
      setPushBusy(false);
    }
  }, []);

  const disablePushNotifications = useCallback(async () => {
    setPushBusy(true);
    try {
      await unsubscribeDeviceFromPush(currentFcmToken);
      setCurrentFcmToken(null);
      setPushPermission(getBrowserPermission());
    } finally {
      setPushBusy(false);
    }
  }, [currentFcmToken]);

  const dismissForegroundToast = useCallback(() => {
    setForegroundToast(null);
  }, []);

  const uploadPushNotificationImage = useCallback(
    async (dataUrl: string): Promise<string> => {
      if (!isAdmin || !auth.currentUser) {
        throw new Error('Administrator authentication is required.');
      }
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/push/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ dataUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        imageUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || 'Failed to upload notification image.');
      }
      return data.imageUrl;
    },
    [isAdmin]
  );

  const sendPushNotification = useCallback(
    async (input: {
      title: string;
      message: string;
      category: PushNotificationCategory;
      imageUrl?: string;
      destinationUrl: string;
    }) => {
      if (!isAdmin || !auth.currentUser) {
        throw new Error('Administrator authentication is required.');
      }
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as {
        notificationId?: string;
        targetCount?: number;
        successCount?: number;
        failureCount?: number;
        prunedCount?: number;
        status?: 'sent' | 'partial' | 'failed';
        error?: string;
      };
      if (!res.ok || !data.notificationId) {
        throw new Error(data.error || 'Failed to deliver push notifications.');
      }
      return {
        notificationId: data.notificationId,
        targetCount: data.targetCount ?? 0,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        prunedCount: data.prunedCount ?? 0,
        status: data.status ?? 'sent',
      };
    },
    [isAdmin]
  );

  const deletePushHistoryItem = useCallback(
    async (notificationId: string) => {
      if (!isAdmin) return;
      try {
        await deleteDoc(doc(db, 'notifications', notificationId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
      }
    },
    [isAdmin]
  );

  const activeSubscriberCount = useMemo(
    () => pushSubscriptions.filter((s) => s.status === 'active').length,
    [pushSubscriptions]
  );
  const totalSubscriberCount = pushSubscriptions.length;

  const value: StoreContextValue = {
    user,
    authReady,
    isAdmin,
    adminCheckDone,
    isDbInitialized,
    loadingCatalog,
    catalogError,
    categories,
    products,
    siteSettings,
    inquiries,
    signInWithGoogle,
    signOutUser,
    bootstrapDatabase,
    applySamplePkrPricing,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveSiteSettings,
    submitContactInquiry,
    markInquiryReviewed,
    deleteInquiry,
    pushSupported,
    vapidConfigured,
    iosNeedsInstall,
    pushPermission,
    isPushSubscribed,
    pushBusy,
    pushServerStatus,
    activeSubscriberCount,
    totalSubscriberCount,
    pushHistory,
    foregroundToast,
    dismissForegroundToast,
    refreshPushServerStatus,
    enablePushNotifications,
    disablePushNotifications,
    uploadPushNotificationImage,
    sendPushNotification,
    deletePushHistoryItem,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider.');
  }
  return ctx;
}
