import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, BellRing, Check, Loader2, ShieldAlert, Smartphone, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { setPromptDismissed } from '../utils/pushNotifications';

export function NotificationBellPanel() {
  const {
    pushSupported,
    vapidConfigured,
    iosNeedsInstall,
    pushPermission,
    isPushSubscribed,
    pushBusy,
    enablePushNotifications,
    disablePushNotifications,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleEnable = async () => {
    setFeedback(null);
    setPromptDismissed(true);
    try {
      await enablePushNotifications();
      setFeedback({
        type: 'success',
        text: 'Notifications enabled. You will receive alerts for rare arrivals and curated releases.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to enable notifications.',
      });
    }
  };

  const handleDisable = async () => {
    setFeedback(null);
    try {
      await disablePushNotifications();
      setFeedback({
        type: 'success',
        text: 'Push notifications have been disabled for this device.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to disable notifications.',
      });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setOpen((prev) => !prev);
        }}
        aria-label="Notification preferences"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center w-10 h-10 text-[#B9B3A8] hover:text-[#B9975B] transition-colors"
      >
        {isPushSubscribed ? (
          <BellRing className="w-4 h-4 text-[#B9975B]" strokeWidth={1.75} />
        ) : (
          <Bell className="w-4 h-4" strokeWidth={1.75} />
        )}
        {isPushSubscribed && (
          <span
            aria-hidden="true"
            className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#B9975B]"
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="ANTIKER Notification Alerts"
          className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-[76px] sm:top-full sm:mt-3 sm:w-88 z-50 bg-[#22221F] border border-[#494335] shadow-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#494335] pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#B9975B]">
                Private Alerts
              </p>
              <h3 className="font-serif text-xl text-[#F5F1E8] mt-0.5">
                Collector Notifications
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notification panel"
              className="p-1 text-[#B9B3A8] hover:text-[#F5F1E8]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#B9B3A8] leading-relaxed">
            Receive quiet alerts when rare antiques, sculptural pieces, and seasonal gallery editions arrive at ANTIKER.
          </p>

          {!pushSupported ? (
            <div className="p-3 bg-[#171715] border border-[#494335] text-xs text-[#B9B3A8] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#B9975B] shrink-0 mt-0.5" />
              <span>
                Web Push notifications are not supported by this browser. Try Chrome, Edge, Firefox, or Safari on macOS/iOS Home Screen.
              </span>
            </div>
          ) : iosNeedsInstall ? (
            <div className="p-3 bg-[#171715] border border-[#494335] text-xs text-[#B9B3A8] flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-[#B9975B] shrink-0 mt-0.5" />
              <span>
                On iPhone and iPad, tap <strong className="text-[#F5F1E8]">Share → Add to Home Screen</strong> first, then open ANTIKER from your Home Screen to subscribe.
              </span>
            </div>
          ) : !vapidConfigured ? (
            <div className="p-3 bg-[#171715] border border-[#494335] text-xs text-[#B9B3A8] space-y-1">
              <div className="text-[#B9975B] font-medium uppercase tracking-wider text-[11px]">
                Configuration Required
              </div>
              <p>
                Web Push certificate key (<code className="text-[#F5F1E8]">VITE_FIREBASE_VAPID_KEY</code>) is not configured yet.
              </p>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="p-3 bg-[#171715] border border-[#494335] text-xs text-[#B9B3A8] space-y-1.5">
              <div className="flex items-center gap-2 text-[#F5F1E8] font-medium">
                <BellOff className="w-3.5 h-3.5 text-[#B9975B]" />
                <span>Notifications Blocked</span>
              </div>
              <p>
                You previously blocked notifications for this site. To re-enable alerts, open your browser site permissions (lock icon in the address bar) and allow Notifications.
              </p>
            </div>
          ) : isPushSubscribed ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#171715] border border-[#B9975B]/50 flex items-center gap-2.5 text-xs text-[#F5F1E8]">
                <Check className="w-4 h-4 text-[#B9975B] shrink-0" />
                <span>Active on this device</span>
              </div>
              <button
                type="button"
                disabled={pushBusy}
                onClick={handleDisable}
                className="w-full py-2.5 px-4 border border-[#494335] text-xs font-medium uppercase tracking-[0.14em] text-[#B9B3A8] hover:border-[#B9975B] hover:text-[#F5F1E8] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {pushBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BellOff className="w-3.5 h-3.5" />
                )}
                <span>Disable Notifications</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={pushBusy}
              onClick={handleEnable}
              className="w-full py-3 px-4 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {pushBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              <span>{pushBusy ? 'Enabling...' : 'Enable Notifications'}</span>
            </button>
          )}

          {feedback && (
            <div
              className={`p-3 border text-xs leading-relaxed ${
                feedback.type === 'success'
                  ? 'bg-[#292823] border-[#B9975B] text-[#F5F1E8]'
                  : 'bg-red-950/50 border-red-700 text-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
