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
    <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-4 max-w-xl mx-auto pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-2xl border border-amber-500/30 ring-1 ring-white/10 backdrop-blur-md">
        
        {/* Top bar with alert beacon & dismiss */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-display text-xs sm:text-sm font-black text-amber-300">
              {activeToast.districtName
                ? `📍 تنبيه محلي (${activeToast.districtName})`
                : isOffer
                ? '🔥 إشعار فوري: عرض وتخفيض جديد'
                : isStore
                ? '🎉 إشعار فوري: متجر ونشاط جديد'
                : '📢 تنبيه مباشر • دليل العراق'}
            </span>
            {activeToast.categoryName && (
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-black text-sky-200">
                {activeToast.categoryName}
              </span>
            )}
            {activeToast.badge && (
              <span className="rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] sm:text-xs font-black text-white">
                {activeToast.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              className="rounded-full p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={dismissToast}
              className="rounded-full p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3.5 pt-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-white shadow-md text-2xl">
            {isOffer ? '🏷️' : isStore ? '🏪' : '🔔'}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-display text-sm sm:text-base font-black text-white truncate">
              {activeToast.title}
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 mt-1 leading-relaxed font-normal sm:font-medium">
              {activeToast.message}
            </p>

            {/* Quick Actions Button */}
            <div className="flex items-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={handleActionClick}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 font-display text-xs sm:text-sm font-bold text-white shadow-xs hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer active:scale-95"
              >
                <span>{isOffer ? 'تصفح العرض' : isStore ? 'عرض المتجر' : 'عرض التفاصيل'}</span>
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={dismissToast}
                className="rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
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
