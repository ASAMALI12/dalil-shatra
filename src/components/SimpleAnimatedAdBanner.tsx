import React, { useState } from 'react';
import { Sparkles, Megaphone, Crown, ArrowLeft } from 'lucide-react';
import { AdvertiseModal } from './AdvertiseModal';
import { VerifiedStoreAdModal } from './VerifiedStoreAdModal';
import { DirectoryItem } from '../types/directory';

interface SimpleAnimatedAdBannerProps {
  onOpenClaimStoreModal?: (store?: DirectoryItem) => void;
}

export const SimpleAnimatedAdBanner: React.FC<SimpleAnimatedAdBannerProps> = ({
  onOpenClaimStoreModal,
}) => {
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  return (
    <>
      {/* المربع الأزرق البسيط الأنيق المطابق للصورة مع أضواء متحركة وانيميشن جذاب للمعلن */}
      <div
        onClick={() => setIsAdModalOpen(true)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 p-4 sm:p-5 text-white shadow-lg shadow-sky-600/20 border border-sky-300/40 cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/30 active:scale-[0.99] group"
      >
        {/* Animated ambient glowing lights / light beam effects */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-white/20 blur-2xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-amber-300/25 blur-2xl animate-pulse delay-700" />
        
        {/* Subtle light sweep animation passing across the banner */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

        {/* Twinkling sparkle lights around corners */}
        <div className="pointer-events-none absolute top-2 right-3 text-amber-200/80 text-xs animate-ping">
          ✦
        </div>
        <div className="pointer-events-none absolute bottom-2 left-4 text-amber-300 text-xs animate-bounce">
          ✨
        </div>
        <div className="pointer-events-none absolute top-3 left-8 text-sky-200 text-sm animate-pulse">
          ★
        </div>

        {/* Banner Content matching the exact user screenshot */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1.5 py-0.5">
          {/* Line 1: ضع إعلانك ليشاهده كل العراق 📢 */}
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-lg sm:text-xl drop-shadow-xs transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 animate-[wiggle_2s_ease-in-out_infinite]">
              📢
            </span>
            <h2 className="font-display text-sm sm:text-base md:text-lg font-black tracking-wide text-white drop-shadow-xs">
              ضع إعلانك ليشاهده كل العراق
            </h2>
          </div>

          {/* Line 2: بسعر 25 ألف لمدة 5 أيام ✨ */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-display text-xs sm:text-sm font-bold text-sky-100">
              بسعر
            </span>
            <span className="font-display text-base sm:text-lg md:text-xl font-black text-amber-300 drop-shadow-md animate-pulse tracking-tight px-1">
              25 ألف
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-sky-100">
              لمدة 5 أيام
            </span>
            <span className="text-base sm:text-lg text-amber-300 drop-shadow-xs animate-spin-slow">
              ✨
            </span>
          </div>
        </div>
      </div>

      {/* مودال حجز ووضع الإعلان عند الضغط على المربع */}
      <VerifiedStoreAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        initialScope="national"
        onOpenClaimStore={onOpenClaimStoreModal}
      />
    </>
  );
};
