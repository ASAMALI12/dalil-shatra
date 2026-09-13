import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Crown,
  PlusCircle,
  MapPin,
} from 'lucide-react';
import { CategoryAd } from '../types/shatrah';

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
  categoryIcon,
  onOpenBookingModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // When ads change or re-filter, reset index safely
  useEffect(() => {
    setCurrentIndex(0);
    setProgressPercent(0);
  }, [ads.length, districtName, categoryName]);

  // 15-second rotation timer: User specified: "15 ثانيه للاعلان ويضهر الذب بعده بالدور للحاجزين ثم يعود للاول وهكذا"
  const ROTATION_SECONDS = 15;

  useEffect(() => {
    if (ads.length <= 1) {
      setProgressPercent(0);
      return;
    }

    const intervalMs = 100; // Update progress bar every 100ms
    const stepIncrement = 100 / ((ROTATION_SECONDS * 1000) / intervalMs);

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          // Switch to next ad in circular order!
          setCurrentIndex((idx) => (idx + 1) % ads.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [ads.length, currentIndex]);

  const activeAd = ads[currentIndex];

  const handleNext = () => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    setProgressPercent(0);
  };

  const handlePrev = () => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setProgressPercent(0);
  };

  // If no ads exist in this category and district yet, show the attractive booking invitation
  if (ads.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/20">
              <Crown className="h-6 w-6 text-white animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                  فرصة إعلانية في {districtName}
                </span>
                <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                  5 آلاف د.ع / يوم
                </span>
              </div>
              <h4 className="font-display text-sm font-extrabold text-slate-900 leading-snug">
                كن أول متجر يظهر في صدارة {categoryName} بـ {districtName}!
              </h4>
              <p className="text-[11px] text-slate-600 font-medium">
                إعلانك يظهر لجميع زوار {districtName} بتاثيرات إعلانية مميزة وأزرار اتصال فوري.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBookingModal}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95 flex-shrink-0 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>احجز إعلانك هنا</span>
          </button>
        </div>
      </div>
    );
  }

  // When ads are present: Render high-impact VIP rotating carousel
  const cleanPhone = activeAd.phone.replace(/[^0-9]/g, '');
  const cleanWhatsapp = (activeAd.whatsapp || activeAd.phone).replace(/[^0-9]/g, '');

  return (
    <div className="relative space-y-2">
      {/* Outer Banner Card with Radiant Advertising Glow & Animated Border */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/90 bg-gradient-to-b from-amber-50/60 via-white to-rose-50/40 p-3.5 sm:p-4 shadow-md shadow-amber-500/10 transition-all">
        {/* Animated ambient background sheen */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-gradient-to-br from-amber-300/30 to-rose-300/20 blur-2xl" />

        {/* Top Header Row: VIP Badge, Rotation Timer Indicator, Dots & Actions */}
        <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70">
          {/* VIP Badge */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
              <Crown className="h-3 w-3 text-amber-200 fill-amber-200" />
              <span>إعلان مميز في صدارة {categoryName}</span>
            </span>
          </div>

          {/* Rotation info & controls */}
          <div className="flex items-center gap-2">
            {ads.length > 1 && (
              <div className="flex items-center gap-1 bg-amber-100/90 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <Clock className="h-3 w-3 text-amber-700 animate-spin" />
                <span>
                  {currentIndex + 1} من {ads.length} • كل {ROTATION_SECONDS} ثانية
                </span>
              </div>
            )}

            {/* Manual Next / Prev arrows for smooth browsing */}
            {ads.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-white hover:bg-amber-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer transition-all active:scale-95"
                  title="الإعلان السابق"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-white hover:bg-amber-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer transition-all active:scale-95"
                  title="الإعلان التالي"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 15-Second Rotation Progress Bar when multiple ads exist */}
        {ads.length > 1 && (
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-amber-200/50 mt-1 mb-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Main Ad Content (Card Layout with Photo, Details, and Contact Buttons) */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-1">
          {/* Ad Image / Visual Icon */}
          <div className="relative flex-shrink-0 flex items-center gap-3 w-full sm:w-auto">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm bg-slate-100 flex-shrink-0">
              <img
                src={activeAd.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80'}
                alt={activeAd.businessName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <span className="absolute bottom-1 right-1 text-xs">👑</span>
            </div>

            {/* Mobile inline title and headline */}
            <div className="flex-1 sm:hidden">
              <h3 className="font-display text-sm font-extrabold text-slate-900 leading-tight">
                {activeAd.businessName}
              </h3>
              <p className="text-xs font-bold text-rose-600 line-clamp-1 mt-0.5">
                {activeAd.headline}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>منطقة {districtName}</span>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Middle Column: Details & Description */}
          <div className="hidden sm:block flex-1 pr-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-base font-black text-slate-900 leading-tight">
                {activeAd.businessName}
              </h3>
              <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span>{districtName}</span>
              </span>
            </div>
            <p className="text-xs font-bold text-rose-600 leading-snug mb-1">
              {activeAd.headline}
            </p>
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
              {activeAd.description}
            </p>
          </div>

          {/* Right/Action Buttons Column: Phone Call, WhatsApp, and Booking */}
          <div className="flex flex-wrap sm:flex-col gap-1.5 w-full sm:w-44 flex-shrink-0">
            {/* Quick Call Button */}
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>اتصال فوري</span>
            </a>

            {/* WhatsApp Button */}
            {cleanWhatsapp && (
              <a
                href={`https://wa.me/964${cleanWhatsapp.startsWith('0') ? cleanWhatsapp.slice(1) : cleanWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2 px-3 text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>واتساب</span>
              </a>
            )}
          </div>
        </div>

        {/* Bottom Bar inside Card: Pagination Indicators & "احجز إعلانك هنا بـ 5 آلاف/يوم" button */}
        <div className="relative z-10 flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-amber-200/70">
          {/* Dots Indicator */}
          {ads.length > 1 ? (
            <div className="flex items-center gap-1.5">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setProgressPercent(0);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-amber-600'
                      : 'w-2 bg-amber-300 hover:bg-amber-400'
                  }`}
                  title={`إعلان رقم ${idx + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>إعلان حصري في {districtName}</span>
            </div>
          )}

          {/* Quick Book Button to join the rotating ads */}
          <button
            type="button"
            onClick={onOpenBookingModal}
            className="flex items-center gap-1 text-[11px] font-extrabold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300/80 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="h-3.5 w-3.5 text-amber-700" />
            <span>احجز إعلانك هنا</span>
          </button>
        </div>
      </div>
    </div>
  );
};
