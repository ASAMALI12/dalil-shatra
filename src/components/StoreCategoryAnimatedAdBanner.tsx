import React, { useState } from 'react';
import { VerifiedStoreAdModal } from './VerifiedStoreAdModal';
import { DirectoryItem } from '../types/directory';

interface StoreCategoryAnimatedAdBannerProps {
  categoryTitle?: string;
  onOpenClaimStoreModal?: (store?: DirectoryItem) => void;
}

export const StoreCategoryAnimatedAdBanner: React.FC<StoreCategoryAnimatedAdBannerProps> = ({
  categoryTitle,
  onOpenClaimStoreModal,
}) => {
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  return (
    <>
      {/* المربع الأزرق لصفحة المتاجر والأقسام بسعر 10 آلاف دينار مع انيميشن ملكي جذاب مختلف كلياً */}
      <div
        onClick={() => setIsAdModalOpen(true)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-sky-600 to-indigo-900 p-3.5 sm:p-4.5 text-white shadow-lg shadow-sky-900/30 border border-amber-300/40 cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:shadow-sky-600/40 active:scale-[0.99] group"
      >
        {/* Distinct Animation 1: Royal Gold & Cobalt Radial Glow */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-sky-400/25 blur-2xl animate-pulse delay-700" />

        {/* Distinct Animation 2: Diagonal Golden Shimmer Wave */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

        {/* Distinct Animation 3: Crown and Sparkle Orbiting Badges */}
        <div className="pointer-events-none absolute top-2 right-4 text-amber-300 text-sm animate-bounce">
          👑
        </div>
        <div className="pointer-events-none absolute bottom-2 left-4 text-amber-200 text-xs animate-ping">
          ⭐
        </div>
        <div className="pointer-events-none absolute top-2.5 left-10 text-sky-200 text-xs animate-pulse">
          ✨
        </div>

        {/* Banner Content for Stores at 10,000 IQD per month */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1.5 py-0.5">
          {/* Line 1: ضع إعلان متجرك في صدارة هذا القسم 📢 */}
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-lg sm:text-xl drop-shadow-xs transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 animate-[wiggle_2s_ease-in-out_infinite]">
              📢
            </span>
            <h2 className="font-display text-xs sm:text-sm md:text-base font-black tracking-wide text-white drop-shadow-xs">
              {categoryTitle ? `ضع إعلان متجرك في صدارة قسم ${categoryTitle}` : 'ضع إعلان متجرك في صدارة هذا القسم'}
            </h2>
          </div>

          {/* Line 2: بسعر 10 آلاف لشهر كامل 👑 */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-display text-xs sm:text-sm font-bold text-sky-100">
              بسعر
            </span>
            <span className="font-display text-base sm:text-lg md:text-xl font-black text-amber-300 drop-shadow-md animate-pulse tracking-tight px-2 py-0.5 bg-black/25 rounded-xl border border-amber-400/50 shadow-inner">
              10 آلاف
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-sky-100">
              لشهر كامل
            </span>
            <span className="text-base sm:text-lg text-amber-300 drop-shadow-xs">
              👑
            </span>
          </div>
        </div>
      </div>

      {/* مودال حجز ووضع الإعلان لنطاق المتجر والقسم (10 آلاف) */}
      <VerifiedStoreAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onOpenClaimStore={onOpenClaimStoreModal}
        initialScope="store_area"
      />
    </>
  );
};
