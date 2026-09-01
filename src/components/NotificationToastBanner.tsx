import React from 'react';
import { X, Sparkles, ArrowLeft, Volume2, VolumeX, Store, Tag, Bell } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { NotificationItem } from '../types/shatrah';

interface NotificationToastBannerProps {
  onOpenTarget?: (notif: NotificationItem) => void;
}

export const NotificationToastBanner: React.FC<NotificationToastBannerProps> = ({
  onOpenTarget,
}) => {
  const { activeToast, dismissToast, soundEnabled, setSoundEnabled } = useNotification();

  if (!activeToast) return null;

  const isOffer = activeToast.type === 'offer';
  const isStore = activeToast.type === 'store';

  const handleActionClick = () => {
    if (onOpenTarget) {
      onOpenTarget(activeToast);
    }
    dismissToast();
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-4 max-w-lg mx-auto pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 text-white shadow-2xl border border-amber-500/30 ring-1 ring-white/10 backdrop-blur-md">
        
        {/* Top bar with alert beacon & dismiss */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-display text-[11px] font-bold text-amber-300">
              {isOffer
                ? '🔥 إشعار فوري: عرض وتخفيض جديد'
                : isStore
                ? '🎉 إشعار فوري: متجر جديد في الشطرة'
                : '📢 تنبيه لجميع أهالي الشطرة'}
            </span>
            {activeToast.badge && (
              <span className="rounded-md bg-red-600/90 px-1.5 py-0.2 text-[9px] font-bold text-white">
                {activeToast.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-amber-400" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={dismissToast}
              className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3 pt-2.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-white shadow-md text-xl">
            {isOffer ? '🏷️' : isStore ? '🏪' : '🔔'}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-display text-xs sm:text-sm font-bold text-white truncate">
              {activeToast.title}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed font-normal">
              {activeToast.message}
            </p>

            {/* Quick Actions Button */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleActionClick}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-1.5 font-display text-xs font-bold text-white shadow-xs hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer active:scale-95"
              >
                <span>{isOffer ? 'تصفح العرض' : isStore ? 'عرض المتجر' : 'عرض التفاصيل'}</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={dismissToast}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
              >
                تجاهل
              </button>
            </div>
          </div>
        </div>

        {/* Subtle timer progress line */}
        <div className="mt-2.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 animate-[progress_6.5s_linear]" />
        </div>
      </div>
    </div>
  );
};
