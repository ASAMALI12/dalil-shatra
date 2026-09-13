import React from 'react';
import { Bell, Tag, Newspaper } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

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
  const { currentLocation } = useLocation();

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* 1. الإشعارات (Notifications) */}
      <button
        type="button"
        onClick={onOpenNotifications}
        className="group relative flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white py-2.5 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="font-display text-xs sm:text-sm font-bold text-slate-800">
          الإشعارات
        </span>
        <div className="relative flex items-center justify-center">
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* 2. عروض منطقتك (Local Offers) */}
      <button
        type="button"
        onClick={onOpenOffers}
        className="group flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white py-2.5 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer truncate"
      >
        <span className="font-display text-xs sm:text-sm font-bold text-slate-800 truncate">
          عروض {currentLocation.districtName !== 'all' ? currentLocation.districtName : currentLocation.governorateName}
        </span>
        <span className="text-lg flex-shrink-0">🏷️</span>
      </button>

      {/* 3. أخبار منطقتك (Local News) */}
      <button
        type="button"
        onClick={onOpenNews}
        className="group flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white py-2.5 px-2 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.98] transition-all cursor-pointer truncate"
      >
        <span className="font-display text-xs sm:text-sm font-bold text-slate-800 truncate">
          أخبار {currentLocation.governorateName}
        </span>
        <span className="text-lg flex-shrink-0">📰</span>
      </button>
    </div>
  );
};
