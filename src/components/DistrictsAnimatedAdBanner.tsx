import React, { useState } from 'react';
import { VerifiedStoreAdModal } from './VerifiedStoreAdModal';
import { DirectoryItem } from '../types/directory';

interface DistrictsAnimatedAdBannerProps {
  governorateName?: string;
  onOpenClaimStoreModal?: (store?: DirectoryItem) => void;
}

export const DistrictsAnimatedAdBanner: React.FC<DistrictsAnimatedAdBannerProps> = ({
  governorateName = 'المحافظة',
  onOpenClaimStoreModal,
}) => {
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  return (
    <>
      {/* المربع الأزرق لصفحة المدن والأقضية بسعر 15 ألف دينار مع انيميشن فريد ومختلف كلياً عن الرئيسية */}
      <div
        onClick={() => setIsAdModalOpen(true)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-4 sm:p-5 text-white shadow-lg shadow-indigo-600/20 border border-cyan-300/40 cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.99] group"
      >
        {/* Distinct Animation 1: Ambient Cyan & Electric Violet Glowing Lights */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-cyan-400/25 blur-2xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-blue-400/25 blur-2xl animate-pulse delay-500" />

        {/* Distinct Animation 2: Laser Scanline / Horizontal Glowing Wave Effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-300/10 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
        
        {/* Distinct Animation 3: Rotating and floating gem sparkles */}
        <div className="pointer-events-none absolute top-2.5 left-4 text-cyan-200 text-xs animate-spin-slow">
          💎
        </div>
        <div className="pointer-events-none absolute bottom-2.5 right-4 text-amber-300 text-xs animate-bounce">
          ⚡
        </div>
        <div className="pointer-events-none absolute top-3 right-10 text-sky-200 text-sm animate-ping">
          ✦
        </div>

        {/* Banner Content matching 15 thousand IQD for cities/districts */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1.5 py-0.5">
          {/* Line 1: ضع إعلانك ليشاهده أهالي المحافظة والمدن 📢 */}
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-lg sm:text-xl drop-shadow-xs transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 animate-[wiggle_1.8s_ease-in-out_infinite]">
              📢
            </span>
            <h2 className="font-display text-sm sm:text-base md:text-lg font-black tracking-wide text-white drop-shadow-xs">
              ضع إعلانك في صدارة مدن {governorateName}
            </h2>
          </div>

          {/* Line 2: بسعر 15 ألف لشهر كامل 💎 */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-display text-xs sm:text-sm font-bold text-cyan-100">
              بسعر
            </span>
            <span className="font-display text-base sm:text-lg md:text-xl font-black text-amber-300 drop-shadow-md animate-pulse tracking-tight px-1 bg-white/10 rounded-lg border border-amber-300/40">
              15 ألف
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-cyan-100">
              لشهر كامل
            </span>
            <span className="text-base sm:text-lg text-cyan-200 drop-shadow-xs">
              💎
            </span>
          </div>
        </div>
      </div>

      {/* مودال حجز ووضع الإعلان لنطاق المحافظة والأقضية (15 ألف) */}
      <VerifiedStoreAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onOpenClaimStore={onOpenClaimStoreModal}
        initialScope="governorate"
      />
    </>
  );
};
