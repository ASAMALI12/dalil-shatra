import React from 'react';
import { Bell, Tag, Newspaper } from 'lucide-react';

interface TopQuickNavProps {
  onOpenNotifications: () => void;
  onOpenOffers: () => void;
  onOpenNews: () => void;
  unreadCount?: number;
}

export const TopQuickNav: React.FC<TopQuickNavProps> = ({
  onOpenNotifications,
  onOpenOffers,
  onOpenNews,
  unreadCount = 2,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {/* 1. الإشعارات (Notifications) */}
      <button
        type="button"
        onClick={onOpenNotifications}
        className="group relative flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white py-3 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="font-display text-sm font-bold text-slate-800">
          الإشعارات
        </span>
        <div className="relative flex items-center justify-center">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* 2. عروض الشطرة (Shatrah Offers) */}
      <button
        type="button"
        onClick={onOpenOffers}
        className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white py-3 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="font-display text-sm font-bold text-slate-800">
          عروض الشطرة
        </span>
        <span className="text-xl">🏷️</span>
      </button>

      {/* 3. أخبار الشطرة (Shatrah News) */}
      <button
        type="button"
        onClick={onOpenNews}
        className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white py-3 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="font-display text-sm font-bold text-slate-800">
          أخبار الشطرة
        </span>
        <span className="text-xl">📰</span>
      </button>
    </div>
  );
};
