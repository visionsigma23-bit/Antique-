import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { PushNotificationCategory } from '../types';
import { compressImageFile } from '../utils/whatsapp';

const CATEGORY_LABELS: Record<PushNotificationCategory, string> = {
  new_arrival: 'New Arrival',
  special_offer: 'Special Offer',
  collection: 'Collection Launch',
  announcement: 'Gallery Announcement',
};

const QUICK_TEMPLATES: {
  label: string;
  category: PushNotificationCategory;
  title: string;
  message: string;
  destinationUrl: string;
}[] = [
  {
    label: 'New Arrival',
    category: 'new_arrival',
    title: 'New Rare Antique Arrival at ANTIKER',
    message:
      'A newly curated heirloom sculptural piece has just entered our collection. View provenance and gallery photography.',
    destinationUrl: '/shop',
  },
  {
    label: 'Special Offer',
    category: 'special_offer',
    title: 'Private Collector Offer — Limited Window',
    message:
      'Enjoy exclusive collector pricing on selected decorative brass vases, wall accents, and bronze pieces.',
    destinationUrl: '/shop',
  },
  {
    label: 'Collection Launch',
    category: 'collection',
    title: 'Explore Our Curated Heritage Collection',
    message:
      'Discover handcrafted antique wall décor, aged vessels, and signature gallery showpieces crafted to elevate timeless interiors.',
    destinationUrl: '/#collections',
  },
];

function formatHistoryDate(raw: unknown): string {
  if (!raw) return 'Just now';
  if (typeof raw === 'object' && raw !== null && 'toDate' in raw) {
    const d = (raw as { toDate: () => Date }).toDate();
    return d.toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  if (raw instanceof Date) {
    return raw.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return 'Recorded';
}

export function AdminPushNotificationsPanel({
  onNotice,
}: {
  onNotice: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    products,
    categories,
    vapidConfigured,
    pushServerStatus,
    activeSubscriberCount,
    totalSubscriberCount,
    pushHistory,
    refreshPushServerStatus,
    uploadPushNotificationImage,
    sendPushNotification,
    deletePushHistoryItem,
  } = useStore();

  const [category, setCategory] = useState<PushNotificationCategory>('new_arrival');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('/shop');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [lastResult, setLastResult] = useState<{
    targetCount: number;
    successCount: number;
    failureCount: number;
    prunedCount: number;
    status: 'sent' | 'partial' | 'failed';
  } | null>(null);

  const serverReady = Boolean(pushServerStatus?.adminSdkReady);
  const systemReady = vapidConfigured && serverReady;

  const destinationPresets = useMemo(() => {
    const items: { label: string; url: string }[] = [
      { label: 'Shop All Collection (/shop)', url: '/shop' },
      { label: 'Homepage Collections (/#collections)', url: '/#collections' },
      { label: 'Homepage (/)', url: '/' },
      { label: 'Concierge Contact (/contact)', url: '/contact' },
    ];
    for (const cat of categories) {
      items.push({
        label: `Category: ${cat.name}`,
        url: `/shop?category=${encodeURIComponent(cat.slug)}`,
      });
    }
    for (const prod of products) {
      items.push({
        label: `Piece: ${prod.name}`,
        url: `/product/${prod.id}`,
      });
    }
    return items;
  }, [categories, products]);

  const applyTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    setCategory(tpl.category);
    setTitle(tpl.title);
    setMessage(tpl.message);
    setDestinationUrl(tpl.destinationUrl);
    setConfirmingSend(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!serverReady) {
      onNotice(
        'error',
        'Upload requires Firebase Admin SDK configuration on the server. Configure FIREBASE_SERVICE_ACCOUNT_JSON or paste a public HTTPS image URL.'
      );
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const compressed = await compressImageFile(file);
      const hostedPath = await uploadPushNotificationImage(compressed);
      setImageUrl(hostedPath);
      onNotice('success', 'Notification banner image uploaded and ready for broadcast.');
    } catch (err) {
      onNotice(
        'error',
        err instanceof Error ? err.message : 'Failed to upload notification image.'
      );
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleReviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onNotice('error', 'Notification title and message are required.');
      return;
    }
    if (!destinationUrl.trim()) {
      onNotice('error', 'Destination URL is required.');
      return;
    }
    if (imageUrl.trim().startsWith('data:')) {
      onNotice(
        'error',
        'Inline base64 images cannot be delivered over FCM. Please upload via the Upload button or paste an HTTPS URL.'
      );
      return;
    }
    setConfirmingSend(true);
  };

  const handleConfirmedSend = async () => {
    setSending(true);
    try {
      const res = await sendPushNotification({
        title: title.trim(),
        message: message.trim(),
        category,
        imageUrl: imageUrl.trim(),
        destinationUrl: destinationUrl.trim(),
      });
      setLastResult({
        targetCount: res.targetCount,
        successCount: res.successCount,
        failureCount: res.failureCount,
        prunedCount: res.prunedCount,
        status: res.status,
      });
      setConfirmingSend(false);
      onNotice(
        res.successCount > 0 ? 'success' : 'error',
        `Notification processed: ${res.successCount} delivered, ${res.failureCount} failed${
          res.prunedCount > 0 ? `, ${res.prunedCount} expired tokens removed` : ''
        }.`
      );
    } catch (err) {
      setConfirmingSend(false);
      onNotice(
        'error',
        err instanceof Error ? err.message : 'Failed to send push notification broadcast.'
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    'w-full h-11 px-3 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50 focus:outline-none focus:border-[#B9975B]';
  const textareaClass =
    'w-full p-3 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50 focus:outline-none focus:border-[#B9975B]';

  return (
    <div className="space-y-8">
      {/* Header + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#22221F] border border-[#494335] p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#B9975B]">
              Active Subscribers
            </p>
            <p className="font-serif text-3xl text-[#F5F1E8] mt-1 tabular-nums">
              {activeSubscriberCount}
            </p>
            <p className="text-xs text-[#B9B3A8] mt-0.5 tabular-nums">
              {totalSubscriberCount} total device records
            </p>
          </div>
          <Users className="w-7 h-7 text-[#B9975B]/80" strokeWidth={1.5} />
        </div>

        <div className="bg-[#22221F] border border-[#494335] p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#B9975B]">
              Campaigns Sent
            </p>
            <p className="font-serif text-3xl text-[#F5F1E8] mt-1 tabular-nums">
              {pushHistory.length}
            </p>
            <p className="text-xs text-[#B9B3A8] mt-0.5">
              Logged with FCM delivery counts
            </p>
          </div>
          <BellRing className="w-7 h-7 text-[#B9975B]/80" strokeWidth={1.5} />
        </div>

        <div className="bg-[#22221F] border border-[#494335] p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#B9975B]">
              FCM System Health
            </p>
            <button
              type="button"
              disabled={refreshingStatus}
              onClick={async () => {
                setRefreshingStatus(true);
                await refreshPushServerStatus();
                setRefreshingStatus(false);
              }}
              aria-label="Refresh FCM configuration status"
              className="text-[#B9B3A8] hover:text-[#B9975B]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {vapidConfigured ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="text-[#F5F1E8]">
                Web Push VAPID: {vapidConfigured ? 'Configured' : 'Missing VITE_FIREBASE_VAPID_KEY'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {serverReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="text-[#F5F1E8]">
                Admin SDK:{' '}
                {serverReady
                  ? `Ready (${pushServerStatus?.configSource})`
                  : `Missing ${pushServerStatus?.missingServerEnvVars?.join(', ') || 'FIREBASE_SERVICE_ACCOUNT_JSON'}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Configuration Notice if credentials are missing */}
      {!systemReady && (
        <div className="bg-[#292823] border border-[#B9975B] p-5 space-y-2 text-xs text-[#B9B3A8]">
          <div className="flex items-center gap-2 text-[#B9975B] font-semibold uppercase tracking-[0.16em]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Firebase Cloud Messaging Credentials Required for Live Delivery</span>
          </div>
          <p className="leading-relaxed">
            Real FCM delivery requires valid credentials from your Firebase project (
            <code className="text-[#F5F1E8]">
              {pushServerStatus?.projectId || 'gen-lang-client-0158019776'}
            </code>
            ). Configure the missing environment secrets below and restart the server:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#F5F1E8]">
            {!vapidConfigured && (
              <li>
                <code>VITE_FIREBASE_VAPID_KEY</code> — Public Web Push certificate key from Firebase Console → Project Settings → Cloud Messaging → Web configuration.
              </li>
            )}
            {!serverReady && (
              <li>
                <code>FIREBASE_SERVICE_ACCOUNT_JSON</code> — Private Service Account JSON from Firebase Console → Project Settings → Service accounts → Generate new private key (stored strictly server-side).
              </li>
            )}
          </ul>
          {pushServerStatus?.initError && (
            <p className="text-red-300 pt-1">Server diagnostic: {pushServerStatus.initError}</p>
          )}
        </div>
      )}

      {/* Composer + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form
          onSubmit={handleReviewClick}
          className="lg:col-span-7 bg-[#22221F] border border-[#494335] p-6 sm:p-8 space-y-5"
        >
          <div className="border-b border-[#494335] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[#F5F1E8]">
                Compose Push Broadcast
              </h2>
              <p className="text-xs text-[#B9B3A8] mt-0.5">
                Send curated announcements directly to subscribed customer devices.
              </p>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#B9975B]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Templates</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-3 py-1.5 bg-[#171715] border border-[#494335] text-xs text-[#F5F1E8] hover:border-[#B9975B] hover:text-[#B9975B] transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                Campaign Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PushNotificationCategory)}
                className={inputClass}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
                Quick Link Target
              </label>
              <select
                value={
                  destinationPresets.some((p) => p.url === destinationUrl)
                    ? destinationUrl
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) setDestinationUrl(e.target.value);
                }}
                className={inputClass}
              >
                <option value="">Custom Destination Path...</option>
                {destinationPresets.map((preset) => (
                  <option key={preset.url} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wider text-[#B9B3A8]">
                Notification Title *
              </label>
              <span className="text-[11px] text-[#B9B3A8] tabular-nums">
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setConfirmingSend(false);
              }}
              placeholder="e.g., New Carved Brass Amphora Arrival"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wider text-[#B9B3A8]">
                Notification Message *
              </label>
              <span className="text-[11px] text-[#B9B3A8] tabular-nums">
                {message.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              required
              maxLength={300}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setConfirmingSend(false);
              }}
              placeholder="Describe the new arrival, special offer, or curated collection..."
              className={textareaClass}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5">
              Destination URL *
            </label>
            <input
              type="text"
              required
              maxLength={300}
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="/shop or /product/antique-brass-wall-planter"
              className={inputClass}
            />
          </div>

          {/* Optional Image Upload / URL */}
          <div className="space-y-2 pt-2 border-t border-[#494335]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs uppercase tracking-wider text-[#B9B3A8]">
                Notification Banner Image (Optional)
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#B9975B] text-xs uppercase tracking-wider text-[#B9975B] hover:bg-[#B9975B]/10 cursor-pointer">
                {uploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleImageFileUpload}
                  className="sr-only"
                />
              </label>
            </div>
            <input
              type="text"
              maxLength={500}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste public https:// image URL or upload a file above"
              className={inputClass}
            />
          </div>

          {/* Review / Confirmation Step */}
          {!confirmingSend ? (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#B9B3A8]">
                {activeSubscriberCount === 0
                  ? 'No active device tokens subscribed yet.'
                  : `Ready to reach ${activeSubscriberCount} active subscriber(s).`}
              </span>
              <button
                type="submit"
                disabled={!serverReady || activeSubscriberCount === 0 || sending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Review &amp; Send</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#292823] border border-[#B9975B] space-y-3">
              <p className="text-xs text-[#F5F1E8] leading-relaxed">
                Confirm broadcast of <strong className="text-[#B9975B]">&ldquo;{title}&rdquo;</strong> to{' '}
                <strong className="tabular-nums">{activeSubscriberCount}</strong> active subscribed device(s)?
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleConfirmedSend}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] disabled:opacity-60"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{sending ? 'Sending...' : 'Confirm & Send Now'}</span>
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setConfirmingSend(false)}
                  className="px-4 py-2.5 border border-[#494335] text-xs uppercase tracking-wider text-[#B9B3A8] hover:text-[#F5F1E8]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {lastResult && (
            <div className="p-4 bg-[#171715] border border-[#494335] text-xs space-y-1">
              <div className="text-[#B9975B] uppercase tracking-wider font-semibold">
                Latest Delivery Report
              </div>
              <p className="text-[#F5F1E8] tabular-nums">
                Targets: {lastResult.targetCount} · Delivered: {lastResult.successCount} · Failed:{' '}
                {lastResult.failureCount} · Pruned Invalid Tokens: {lastResult.prunedCount}
              </p>
            </div>
          )}
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#22221F] border border-[#494335] p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#B9975B]">
              Device Notification Preview
            </div>

            <div className="bg-[#292823] border border-[#494335] p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-[11px] text-[#B9B3A8]">
                <div className="flex items-center gap-2">
                  <img
                    src="/pwa-192x192.png"
                    alt="ANTIKER"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="uppercase tracking-[0.16em] text-[#F5F1E8] font-medium">
                    ANTIKER
                  </span>
                </div>
                <span>{CATEGORY_LABELS[category]}</span>
              </div>

              <div>
                <h4 className="font-serif text-lg text-[#F5F1E8]">
                  {title || 'Notification Title Preview'}
                </h4>
                <p className="text-xs text-[#B9B3A8] mt-1 leading-relaxed">
                  {message ||
                    'Your notification copy will appear here across desktop, Android, and installed iOS PWA notifications.'}
                </p>
              </div>

              {imageUrl && !imageUrl.startsWith('data:') && (
                <div className="aspect-[16/9] bg-[#171715] border border-[#494335] overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Notification visual"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-[#494335]/60 flex items-center justify-between text-[11px] text-[#B9975B]">
                <span className="truncate">{destinationUrl || '/shop'}</span>
                <ExternalLink className="w-3 h-3 shrink-0 ml-2" />
              </div>
            </div>

            <p className="text-xs text-[#B9B3A8] leading-relaxed">
              Subscribers who click the notification will open directly at{' '}
              <code className="text-[#F5F1E8]">{destinationUrl || '/shop'}</code>. Expired or revoked device tokens are automatically cleaned during delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Sending History */}
      <div className="space-y-4">
        <div>
          <h3 className="font-serif text-2xl text-[#F5F1E8]">
            Notification Sending History
          </h3>
          <p className="text-xs text-[#B9B3A8] mt-0.5">
            Real-time log of all dispatched broadcasts and FCM delivery metrics.
          </p>
        </div>

        {pushHistory.length === 0 ? (
          <div className="bg-[#22221F] border border-[#494335] py-14 text-center">
            <BellRing className="w-6 h-6 text-[#B9975B] mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-serif text-xl text-[#F5F1E8]">No broadcasts sent yet</p>
            <p className="text-xs text-[#B9B3A8] mt-1">
              Dispatched notifications and subscriber delivery metrics will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pushHistory.map((item) => (
              <div
                key={item.id}
                className="bg-[#292823] border border-[#494335] p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-20 h-16 object-cover border border-[#494335] bg-[#171715] shrink-0"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider">
                      <span className="text-[#B9975B]">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className="text-[#B9B3A8]">·</span>
                      <span className="text-[#B9B3A8]">
                        {formatHistoryDate(item.createdAt)}
                      </span>
                      <span className="text-[#B9B3A8]">·</span>
                      <span
                        className={
                          item.status === 'sent'
                            ? 'text-emerald-400'
                            : item.status === 'partial'
                              ? 'text-amber-400'
                              : 'text-red-400'
                        }
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-serif text-xl text-[#F5F1E8]">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#B9B3A8] leading-relaxed">
                      {item.message}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#B9B3A8] tabular-nums">
                      <span>Target URL: {item.destinationUrl}</span>
                      <span className="text-[#F5F1E8]">
                        Delivered: {item.successCount}/{item.targetCount}
                      </span>
                      {item.failureCount > 0 && (
                        <span className="text-red-300">Failed: {item.failureCount}</span>
                      )}
                      {item.prunedCount > 0 && (
                        <span>Pruned: {item.prunedCount}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deletePushHistoryItem(item.id)}
                  aria-label="Delete notification record"
                  className="p-2 border border-[#494335] text-[#B9B3A8] hover:text-red-400 self-end sm:self-start shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
