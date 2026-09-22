import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export interface CinematicAdBillboardProps {
  businessName: string;
  headline?: string;
  description: string;
  images: string[];
  phone: string;
  whatsapp?: string;
  offerBadge?: string;
  governorateName?: string;
  districtName?: string;
  categoryName?: string;
  aiStyle?: {
    fontSize?: 'small' | 'medium' | 'large' | 'huge';
    textColor?: string;
    bgColor?: string;
    animation?: 'pulse' | 'slide' | 'glow' | 'subtle';
  };
  lightingTheme?: 'gold' | 'neon-blue' | 'emerald' | 'sunset' | 'purple';
  variant?: 'billboard' | 'compact' | 'story';
  isLivePreview?: boolean;
  onCall?: () => void;
}

export const CinematicAdBillboard: React.FC<CinematicAdBillboardProps> = ({
  businessName,
  headline,
  description,
  images = [],
  phone,
  whatsapp,
  offerBadge = 'عرض حصري 👑',
  governorateName = 'عموم العراق',
  districtName,
  categoryName,
  aiStyle,
  lightingTheme = 'gold',
  variant = 'billboard',
  isLivePreview = false,
  onCall,
}) => {
  // Safe image list with high-quality fallback
  const validImages =
    images.length > 0
      ? images
      : [
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
        ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate images slideshow every 3.8 seconds if more than 1 image exists
  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % validImages.length);
    }, 3800);

    return () => clearInterval(interval);
  }, [validImages.length, isHovered]);

  // Ensure index stays valid if images array length changes
  useEffect(() => {
    if (activeImageIndex >= validImages.length) {
      setActiveImageIndex(0);
    }
  }, [validImages.length, activeImageIndex]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  // Font size config
  const fontSizes = {
    small: { title: 'text-base sm:text-lg font-bold', desc: 'text-xs leading-relaxed line-clamp-2' },
    medium: { title: 'text-lg sm:text-2xl font-black', desc: 'text-xs sm:text-sm leading-relaxed line-clamp-2' },
    large: { title: 'text-xl sm:text-3xl font-black', desc: 'text-sm sm:text-base leading-relaxed line-clamp-3' },
    huge: { title: 'text-2xl sm:text-4xl font-black tracking-tight', desc: 'text-base sm:text-lg leading-relaxed line-clamp-3' },
  };

  const chosenFontSize = aiStyle?.fontSize ? fontSizes[aiStyle.fontSize] : fontSizes.medium;
  const customTextColor = aiStyle?.textColor || '#FFFFFF';

  // Lighting & Ambient FX mapping
  const lightingConfigs = {
    gold: {
      border: 'border-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.3)] ring-1 ring-amber-300/50',
      badgeBg: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-amber-300',
      glowSpot: 'bg-amber-500/25',
      accentColor: 'text-amber-300',
      beam: 'from-amber-400/0 via-amber-200/20 to-amber-400/0',
    },
    'neon-blue': {
      border: 'border-cyan-400/80 shadow-[0_0_35px_rgba(34,211,238,0.35)] ring-1 ring-cyan-300/50',
      badgeBg: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-slate-950 border-cyan-300',
      glowSpot: 'bg-cyan-500/25',
      accentColor: 'text-cyan-300',
      beam: 'from-cyan-400/0 via-cyan-200/20 to-cyan-400/0',
    },
    emerald: {
      border: 'border-emerald-400/80 shadow-[0_0_35px_rgba(52,211,153,0.35)] ring-1 ring-emerald-300/50',
      badgeBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 border-emerald-300',
      glowSpot: 'bg-emerald-500/25',
      accentColor: 'text-emerald-300',
      beam: 'from-emerald-400/0 via-emerald-200/20 to-emerald-400/0',
    },
    sunset: {
      border: 'border-rose-400/80 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-1 ring-rose-300/50',
      badgeBg: 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white border-rose-300',
      glowSpot: 'bg-rose-500/25',
      accentColor: 'text-rose-300',
      beam: 'from-rose-400/0 via-rose-200/20 to-rose-400/0',
    },
    purple: {
      border: 'border-purple-400/80 shadow-[0_0_35px_rgba(192,132,252,0.35)] ring-1 ring-purple-300/50',
      badgeBg: 'bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-600 text-white border-purple-300',
      glowSpot: 'bg-purple-500/25',
      accentColor: 'text-purple-300',
      beam: 'from-purple-400/0 via-purple-200/20 to-purple-400/0',
    },
  };

  const light = lightingConfigs[lightingTheme] || lightingConfigs.gold;

  // Phone & WhatsApp formatting
  const rawPhone = phone || '07801234567';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const rawWhatsapp = whatsapp || phone || '07801234567';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden rounded-3xl border-2 transition-all duration-500 select-none group ${light.border} ${
        variant === 'story'
          ? 'aspect-[9/14] min-h-[440px] max-h-[580px]'
          : variant === 'compact'
          ? 'h-64 sm:h-72'
          : 'h-80 sm:h-96 md:h-[420px]'
      }`}
      dir="rtl"
    >
      {/* 1. BACKGROUND STORE IMAGES: FULL-BLEED BILLBOARD CANVAS WITH KEN-BURNS ANIMATION */}
      {validImages.map((imgUrl, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === activeImageIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={imgUrl}
            alt={`${businessName} - صورة ${idx + 1}`}
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-7000 ease-out"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85';
            }}
          />
        </div>
      ))}

      {/* 2. ATMOSPHERIC CINEMATIC LIGHTING & MULTI-LAYER VIGNETTE OVERLAYS */}
      {/* Dynamic ambient gradient - darker at bottom for text, subtle at top for badges */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/30" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/40" />

      {/* Radiant Glow Spots in the Corners & Center */}
      <div
        className={`pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl animate-pulse ${light.glowSpot} z-10`}
      />
      <div
        className={`pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full blur-3xl animate-pulse delay-700 ${light.glowSpot} z-10`}
      />

      {/* Dynamic Luminous Sweep (Beam of Light traversing the Billboard) */}
      <div
        className={`pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-2500 bg-gradient-to-r ${light.beam} z-10`}
      />

      {/* Sparkling Ambient Stars floating on canvas */}
      <div className="pointer-events-none absolute top-4 left-6 text-amber-300 text-sm animate-bounce z-20">
        ✦
      </div>
      <div className="pointer-events-none absolute bottom-16 right-6 text-amber-200 text-xs animate-ping z-20">
        ✨
      </div>

      {/* 3. MULTI-IMAGE NAVIGATION CONTROLS (IF MORE THAN 1 IMAGE) */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            title="الصورة السابقة"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            title="الصورة التالية"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Dots Indicator & Mini Gallery Counter floating directly on the Billboard */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md">
            <span>{activeImageIndex + 1}</span>
            <span className="text-white/50">/</span>
            <span>{validImages.length} صور</span>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            {validImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeImageIndex === i ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`الصورة رقم ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* 4. BILLBOARD CONTENT FLOATING DIRECTLY ON STORE PHOTO */}
      <div className="relative z-20 flex flex-col justify-between h-full p-4 sm:p-6 md:p-7 text-right">
        {/* TOP BAR: Floating Verified Badges & Category */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Main Verified Store Crown Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 backdrop-blur-md px-3 py-1 text-xs font-black shadow-lg">
              <Crown className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>متجر موثق في دليل العراق</span>
            </span>

            {/* Live Preview Indicator for Advertisers */}
            {isLivePreview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold animate-pulse">
                <CheckCircle2 className="h-3 w-3" />
                <span>معاينة حية للمعلن</span>
              </span>
            )}
          </div>

          {/* Offer Badge (Pulsing Glow) */}
          <div className="flex items-center gap-2">
            {offerBadge && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-xl border animate-bounce ${light.badgeBg}`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>{offerBadge}</span>
              </span>
            )}

            {governorateName && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/50 text-slate-200 border border-white/15 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold">
                <MapPin className="h-3 w-3 text-amber-400" />
                <span>{districtName ? `${governorateName} • ${districtName}` : governorateName}</span>
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM / CENTER SECTION: Store Name & Information directly on the photo */}
        <div className="space-y-3 max-w-2xl mt-auto">
          {/* Category Chip */}
          {categoryName && (
            <div className="inline-block">
              <span className="rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-200 backdrop-blur-md px-2.5 py-0.5 text-[10px] sm:text-xs font-bold">
                {categoryName}
              </span>
            </div>
          )}

          {/* Store Name - Big, Bold, Striking with Drop Shadow & Optional User Color */}
          <div className="space-y-1">
            <h3
              className={`${chosenFontSize.title} font-display text-white tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]`}
              style={{ color: customTextColor }}
            >
              {businessName || 'اسم متجرك أو نشاطك التجاري'}
            </h3>

            {headline && headline !== businessName && (
              <h4 className="text-xs sm:text-sm md:text-base font-bold text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {headline}
              </h4>
            )}
          </div>

          {/* Ad Description / Offers - Crisp legibility floating on image */}
          <p
            className={`${chosenFontSize.desc} text-slate-100 font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] bg-black/35 backdrop-blur-xs p-2.5 sm:p-3 rounded-2xl border border-white/10`}
          >
            {description ||
              'اكتب هنا تفاصيل عروض متجرك والخدمات المميزة التي تقدمها للزبائن ليظهر الإعلان بأعلى جاذبية واحترافية.'}
          </p>

          {/* ACTION BUTTONS DIRECTLY OVER THE PHOTO */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Direct Phone Call Button */}
            <a
              href={`tel:${cleanPhone}`}
              onClick={(e) => {
                if (isLivePreview) e.preventDefault();
                onCall?.();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-4 text-xs sm:text-sm shadow-xl shadow-emerald-950/60 transition-all hover:scale-105 active:scale-95 border border-emerald-300/40 cursor-pointer"
            >
              <Phone className="h-4 w-4 animate-pulse" />
              <span>اتصال فوري: {rawPhone}</span>
            </a>

            {/* Direct WhatsApp Chat Button */}
            {rawWhatsapp && (
              <a
                href={`https://wa.me/964${cleanWhatsapp.startsWith('0') ? cleanWhatsapp.slice(1) : cleanWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isLivePreview && e.preventDefault()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black py-2.5 px-4 text-xs sm:text-sm shadow-xl shadow-green-950/60 transition-all hover:scale-105 active:scale-95 border border-white/30 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 fill-slate-950" />
                <span>محادثة واتساب</span>
              </a>
            )}

            {/* Share / Bookmark Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: businessName,
                    text: description,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              className="flex items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="مشاركة الإعلان"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
