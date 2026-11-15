import React, { useEffect, useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isPromptDismissed, setPromptDismissed } from '../utils/pushNotifications';

export function PushOptInCard() {
  const {
    pushSupported,
    vapidConfigured,
    iosNeedsInstall,
    pushPermission,
    isPushSubscribed,
    pushBusy,
    enablePushNotifications,
  } = useStore();

  const [visible, setVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      !pushSupported ||
      !vapidConfigured ||
      iosNeedsInstall ||
      isPushSubscribed ||
      pushPermission !== 'default' ||
      isPromptDismissed()
    ) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [pushSupported, vapidConfigured, iosNeedsInstall, isPushSubscribed, pushPermission]);

  if (!visible) return null;

  const handleDismiss = () => {
    setPromptDismissed(true);
    setVisible(false);
  };

  const handleEnable = async () => {
    setErrorMsg(null);
    setPromptDismissed(true);
    try {
      await enablePushNotifications();
      setVisible(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to enable notifications.');
    }
  };

  return (
    <aside
      aria-label="Enable new arrival notifications"
      className="fixed bottom-5 right-5 z-40 w-[calc(100vw-6.5rem)] max-w-xs bg-[#22221F]/95 backdrop-blur-md border border-[#494335] shadow-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[#B9975B]">
          <Bell className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
            Private Releases
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          className="text-[#B9B3A8] hover:text-[#F5F1E8] p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-[#F5F1E8] leading-relaxed">
        Receive alerts when rare antique pieces and limited editions arrive at ANTIKER.
      </p>

      {errorMsg && (
        <p className="text-[11px] text-red-300 leading-snug">{errorMsg}</p>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={pushBusy}
          onClick={handleEnable}
          className="flex-1 py-2 px-3 bg-[#B9975B] text-[#171715] text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-[#CCA86B] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {pushBusy && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{pushBusy ? 'Enabling...' : 'Enable Notifications'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="py-2 px-2.5 border border-[#494335] text-[11px] uppercase tracking-wider text-[#B9B3A8] hover:text-[#F5F1E8]"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
