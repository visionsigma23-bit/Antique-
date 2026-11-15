export type AvailabilityStatus = 'In Stock' | 'Limited Piece' | 'Made to Order' | 'Out of Stock';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number; // 0 means Price Upon Inquiry (editable in Admin)
  description: string;
  details: string[];
  availability: AvailabilityStatus;
  featured: boolean;
  bestSeller: boolean;
  images: string[];
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SiteSettings {
  brandName: string;
  heroHeadline: string;
  heroSubtitle: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCtaText: string;
  aboutTitle: string;
  aboutBody: string;
  whatsappNumber: string;
  phoneDisplay: string;
  emailDisplay: string;
  addressDisplay: string;
  instagramHandle: string;
  facebookUrl: string;
  pinterestUrl: string;
  currencySymbol: string;
  updatedAt?: unknown;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed';
  createdAt?: unknown;
}

export type PushNotificationCategory =
  | 'new_arrival'
  | 'special_offer'
  | 'collection'
  | 'announcement';

export interface PushSubscriptionRecord {
  id: string;
  token: string;
  platform: string;
  userAgent: string;
  status: 'active' | 'disabled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PushNotificationRecord {
  id: string;
  title: string;
  message: string;
  category: PushNotificationCategory;
  imageUrl: string;
  destinationUrl: string;
  targetCount: number;
  successCount: number;
  failureCount: number;
  prunedCount: number;
  status: 'sent' | 'partial' | 'failed';
  sentByEmail: string;
  createdAt?: unknown;
}

export interface PushServerStatus {
  adminSdkReady: boolean;
  configSource: string | null;
  missingServerEnvVars: string[];
  initError: string | null;
  vapidConfiguredInProcessEnv: boolean;
  projectId: string;
  databaseId: string;
}

export interface ForegroundPushPayload {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  url: string;
  category: PushNotificationCategory;
}

