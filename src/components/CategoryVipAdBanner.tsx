import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { CategoryAd } from '../types/shatrah';
import { CinematicAdBillboard } from './CinematicAdBillboard';

interface CategoryVipAdBannerProps {
  ads: CategoryAd[];
  districtName: string;
  categoryName: string;
  categoryIcon: string;
  onOpenBookingModal: () => void;
  onSelectStorePhone?: (phone: string) => void;
}

export const CategoryVipAdBanner: React.FC<CategoryVipAdBannerProps> = ({
  ads,
  districtName,
  categoryName,
  onOpenBookingModal,
  onSelectStorePhone,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // When ads change or re-filter, reset index safely
  useEffect(() => {
    setCurrentIndex(0);
  }, [ads.length, districtName, categoryName]);

  // 12-second rotation timer between multiple booked advertisers
  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 12000);

    return () => clearInterval(timer);
  }, [ads.length, currentIndex]);

  const activeAd = ads[currentIndex];

  const handleNext = () => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handlePrev = () => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  // If no ads exist in this category and district yet, show the attractive booking invitation
  if (ads.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-sm">
              <Crown className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                فرصة تصدر قسم {categoryName} في {districtName} 👑
              </div>
              <p className="text-[11px] text-slate-600">
                ضع إعلان متجرك في الصدارة لمدة 5 أيام
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBookingModal}
            className="shrink-0 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-extrabold text-xs px-3.5 py-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            احجز إعلانك الآن
          </button>
        </div>
      </div>
    );
  }

  // Active Ad: Direct, Sleek, Unobstructed Real Billboard Rectangle
  return (
    <div className="relative w-full space-y-1.5">
      <CinematicAdBillboard
        businessName={activeAd.businessName}
        headline={activeAd.headline || activeAd.businessName}
        description={activeAd.description}
        images={
          activeAd.images && activeAd.images.length > 0
            ? activeAd.images
            : activeAd.imageUrl
            ? [activeAd.imageUrl]
            : []
        }
        phone={activeAd.phone}
        scope={activeAd.scope}
        governorateName={activeAd.governorateName}
        districtName={districtName}
        categoryName={categoryName}
        aiStyleId={((activeAd.aiStyle as any)?.lightingTheme as any) || 'ticker-bottom-white'}
        onCall={() => onSelectStorePhone?.(activeAd.phone)}
      />

      {/* Multiple Ads Indicator & Switcher */}
      {ads.length > 1 && (
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-bold">
          <div className="flex items-center gap-1">
            {ads.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-4 bg-amber-500' : 'w-1.5 bg-slate-300'
                }`}
                title={`إعلان ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span>إعلان {currentIndex + 1} من {ads.length}</span>
            <button
              type="button"
              onClick={handlePrev}
              className="p-0.5 rounded text-slate-600 hover:text-black cursor-pointer"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-0.5 rounded text-slate-600 hover:text-black cursor-pointer"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
