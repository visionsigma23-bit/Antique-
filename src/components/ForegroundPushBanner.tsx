import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function ForegroundPushBanner() {
  const { foregroundToast, dismissForegroundToast } = useStore();

  if (!foregroundToast) return null;

  const isExternal = /^https?:\/\//i.test(foregroundToast.url);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm bg-[#292823] border border-[#B9975B] shadow-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[#B9975B]">
          <BellRing className="w-4 h-4 shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
            ANTIKER Dispatch
          </span>
        </div>
        <button
          type="button"
          onClick={dismissForegroundToast}
          aria-label="Dismiss notification"
          className="text-[#B9B3A8] hover:text-[#F5F1E8] p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        {foregroundToast.imageUrl && (
          <img
            src={foregroundToast.imageUrl}
            alt={foregroundToast.title}
            className="w-16 h-14 object-cover border border-[#494335] shrink-0 bg-[#171715]"
          />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-lg text-[#F5F1E8] leading-snug">
            {foregroundToast.title}
          </h4>
          <p className="text-xs text-[#B9B3A8] mt-1 leading-relaxed">
            {foregroundToast.body}
          </p>
        </div>
      </div>

      <div className="pt-1 flex justify-end">
        {isExternal ? (
          <a
            href={foregroundToast.url}
            onClick={dismissForegroundToast}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#B9975B] hover:text-[#CCA86B] font-semibold"
          >
            <span>Explore Piece</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <Link
            to={foregroundToast.url}
            onClick={dismissForegroundToast}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#B9975B] hover:text-[#CCA86B] font-semibold"
          >
            <span>Explore Piece</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
