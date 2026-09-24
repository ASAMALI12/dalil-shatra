import React, { useState, useEffect } from 'react';
import { Phone, ChevronRight, ChevronLeft } from 'lucide-react';

export interface BillboardAiStyle {
  id: string;
  name: string;
  motionName: string;
  motionType: 'ticker-bottom' | 'slide-down' | 'slide-up' | 'center-zoom' | 'corner-glide' | 'ticker-top';
  textColor: string;
  glowColor: string;
  borderColor: string;
  fontSizeClass: string;
}

export const AI_BILLBOARD_STYLES: BillboardAiStyle[] = [
  {
    id: 'ticker-bottom-white',
    name: 'شريط سفلي متحرك (أبيض كريستالي)',
    motionName: 'شريط سفلي متحرك',
    motionType: 'ticker-bottom',
    textColor: 'text-white',
    glowColor: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]',
    borderColor: 'border-white/50 shadow-lg shadow-black/50',
    fontSizeClass: 'text-xs sm:text-sm font-black',
  },
  {
    id: 'slide-down-gold',
    name: 'هبوط سينمائي كبير (ذهبي ملكي)',
    motionName: 'هبوط كبير من الأعلى للأسفل',
    motionType: 'slide-down',
    textColor: 'text-amber-300',
    glowColor: 'drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]',
    borderColor: 'border-amber-400/80 shadow-lg shadow-amber-950/50',
    fontSizeClass: 'text-sm sm:text-base font-black',
  },
  {
    id: 'slide-up-cyan',
    name: 'صعود شفاف دراماتيكي (نيون سماوي)',
    motionName: 'صعود انسيابي من الأسفل للأعلى',
    motionType: 'slide-up',
    textColor: 'text-cyan-300',
    glowColor: 'drop-shadow-[0_0_14px_rgba(6,182,212,0.95)]',
    borderColor: 'border-cyan-400/80 shadow-lg shadow-cyan-950/50',
    fontSizeClass: 'text-sm sm:text-base font-black',
  },
  {
    id: 'center-zoom-emerald',
    name: 'نبض وزوم مكبّر في المنتصف (زمردي راقي)',
    motionName: 'نبض وتكبير مركزي',
    motionType: 'center-zoom',
    textColor: 'text-emerald-300',
    glowColor: 'drop-shadow-[0_0_16px_rgba(16,185,129,0.95)]',
    borderColor: 'border-emerald-400/80 shadow-lg shadow-emerald-950/50',
    fontSizeClass: 'text-base sm:text-lg font-black',
  },
  {
    id: 'corner-glide-sunset',
    name: 'حركة انسيابية بين زوايا المستطيل (غروب دافئ)',
    motionName: 'حركة رشيقة بين الزوايا',
    motionType: 'corner-glide',
    textColor: 'text-rose-300',
    glowColor: 'drop-shadow-[0_0_14px_rgba(244,63,94,0.95)]',
    borderColor: 'border-rose-400/80 shadow-lg shadow-rose-950/50',
    fontSizeClass: 'text-sm sm:text-base font-black',
  },
  {
    id: 'ticker-top-gold',
    name: 'شريط علوي متدفق (ذهبي مشرق)',
    motionName: 'شريط علوي عريض متدفق',
    motionType: 'ticker-top',
    textColor: 'text-yellow-300',
    glowColor: 'drop-shadow-[0_0_12px_rgba(234,179,8,0.9)]',
    borderColor: 'border-yellow-400/80 shadow-lg shadow-yellow-950/50',
    fontSizeClass: 'text-xs sm:text-sm font-black',
  },
  {
    id: 'center-zoom-white',
    name: 'كتابة عريضة مكبّرة في الوسط (كريستال ناصع)',
    motionName: 'كتابة مكبرة في المنتصف',
    motionType: 'center-zoom',
    textColor: 'text-white',
    glowColor: 'drop-shadow-[0_0_16px_rgba(255,255,255,1)]',
    borderColor: 'border-white/70 shadow-lg shadow-slate-900/60',
    fontSizeClass: 'text-base sm:text-lg font-black',
  },
];

export interface CinematicAdBillboardProps {
  businessName?: string;
  headline?: string;
  description?: string;
  images: string[];
  phone: string;
  whatsapp?: string;
  scope?: 'national' | 'governorate' | 'store_area';
  governorateName?: string;
  districtName?: string;
  categoryName?: string;
  aiStyleId?: string;
  lightingTheme?: string;
  isLivePreview?: boolean;
  onCall?: () => void;
}

export const CinematicAdBillboard: React.FC<CinematicAdBillboardProps> = ({
  businessName,
  description,
  images = [],
  phone,
  scope,
  governorateName,
  districtName,
  categoryName,
  aiStyleId = 'ticker-bottom-white',
  lightingTheme,
  isLivePreview = false,
  onCall,
}) => {
  // Safe image list (fills 100% of the rectangle without borders or shaded edges)
  const validImages =
    images.length > 0
      ? images
      : [
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
        ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Resolved Style
  const resolvedStyle =
    AI_BILLBOARD_STYLES.find((s) => s.id === aiStyleId) ||
    AI_BILLBOARD_STYLES.find((s) => s.id === lightingTheme) ||
    AI_BILLBOARD_STYLES[0];

  // Alternating rotating photos every 3 seconds
  useEffect(() => {
    if (validImages.length <= 1) return;
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % validImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [validImages.length, isHovered]);

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

  const cleanPhone = (phone || '').replace(/\D/g, '');

  // Text content to display
  const displayParts = [
    businessName?.trim(),
    description?.trim(),
    phone?.trim() ? `هاتف: ${phone.trim()}` : null,
  ].filter(Boolean);

  const displayFullText = displayParts.join('  ★  ');
  const shortHeadlineText = displayParts[0] || 'إعلان معتمد في دليل العراق';

  // Render Top Corner Badge based on scope
  const renderTopBadge = () => {
    if (scope === 'national' || categoryName === 'عموم العراق') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-xs text-amber-300 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black drop-shadow-md">
          <span>🇮🇶 عموم العراق</span>
        </span>
      );
    }

    if (scope === 'governorate') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-xs text-amber-300 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black drop-shadow-md">
          <span>🏛️ {governorateName || 'المحافظة'}</span>
        </span>
      );
    }

    // store_area (Only inside stores / specific sections)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-xs text-amber-300 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black drop-shadow-md">
        <span>👑 {categoryName || 'إعلان مميز'}</span>
        {districtName && districtName !== 'all' && (
          <span className="text-white/90">• {districtName}</span>
        )}
      </span>
    );
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden rounded-2xl border ${resolvedStyle.borderColor} select-none group bg-black`}
      style={{
        // Published horizontal banner aspect ratio (2.6:1)
        aspectRatio: '2.6 / 1',
      }}
    >
      {/* 1. SLIDESHOW PHOTOS: FILL 100% OF RECTANGLE - NO SHADED EDGES */}
      {validImages.map((imgUrl, idx) => {
        const isActive = idx === activeImageIndex;
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={imgUrl}
              alt={`صورة ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85';
              }}
            />
          </div>
        );
      })}

      {/* 2. TOP CORNER BADGE & PHOTO COUNTER */}
      <div className="absolute top-2 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
        {renderTopBadge()}

        {validImages.length > 1 && (
          <span className="rounded-full bg-black/50 backdrop-blur-xs text-white border border-white/20 font-mono text-[9px] px-1.5 py-0.5 font-bold drop-shadow-md">
            {activeImageIndex + 1}/{validImages.length}
          </span>
        )}
      </div>

      {/* 3. ARROWS FOR MANUAL SWITCHING (Hover Only) */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md active:scale-95"
            title="السابق"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={nextImage}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md active:scale-95"
            title="التالي"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {/* 4. FAST CALL BUTTON (Bottom Left, Minimal) */}
      {cleanPhone && (
        <a
          href={`tel:${cleanPhone}`}
          onClick={(e) => {
            if (isLivePreview) e.preventDefault();
            onCall?.();
          }}
          className="absolute left-2 bottom-1.5 z-30 flex items-center gap-1 rounded-xl bg-emerald-600/85 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 text-[10px] sm:text-xs shadow-md backdrop-blur-xs transition-all active:scale-95 border border-emerald-300/40 cursor-pointer"
        >
          <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>اتصال</span>
        </a>
      )}

      {/* 5. DYNAMIC TRANSPARENT ANIMATED TEXT (Based on selected motion) */}
      {displayFullText && (
        <>
          {/* A. BOTTOM TICKER (Right to Left) */}
          {resolvedStyle.motionType === 'ticker-bottom' && (
            <div className="absolute inset-x-0 bottom-1.5 z-20 overflow-hidden pointer-events-none pr-2 pl-16">
              <div className="animate-billboard-ticker flex items-center gap-6">
                <span
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]`}
                >
                  {displayFullText}
                </span>
                <span
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]`}
                >
                  ★ {displayFullText}
                </span>
              </div>
            </div>
          )}

          {/* B. TOP TICKER */}
          {resolvedStyle.motionType === 'ticker-top' && (
            <div className="absolute inset-x-0 top-7 z-20 overflow-hidden pointer-events-none px-2">
              <div className="animate-billboard-ticker-top flex items-center gap-6">
                <span
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]`}
                >
                  {displayFullText}
                </span>
                <span
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]`}
                >
                  ★ {displayFullText}
                </span>
              </div>
            </div>
          )}

          {/* C. SLIDE DOWN FROM TOP */}
          {resolvedStyle.motionType === 'slide-down' && (
            <div className="absolute inset-x-0 inset-y-0 z-20 flex items-center justify-center pointer-events-none px-4">
              <div className="animate-billboard-slide-down text-center">
                <div
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] leading-tight`}
                >
                  {shortHeadlineText}
                </div>
                {description && description !== shortHeadlineText && (
                  <div
                    className={`font-display text-xs sm:text-sm font-bold mt-1 text-white/95 ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                  >
                    {description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D. SLIDE UP FROM BOTTOM */}
          {resolvedStyle.motionType === 'slide-up' && (
            <div className="absolute inset-x-0 inset-y-0 z-20 flex items-center justify-center pointer-events-none px-4">
              <div className="animate-billboard-slide-up text-center">
                <div
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] leading-tight`}
                >
                  {shortHeadlineText}
                </div>
                {description && description !== shortHeadlineText && (
                  <div
                    className={`font-display text-xs sm:text-sm font-bold mt-1 text-white/95 ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                  >
                    {description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* E. CENTER ZOOM & GLOW */}
          {resolvedStyle.motionType === 'center-zoom' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4 text-center">
              <div className="animate-billboard-center-zoom max-w-[90%]">
                <div
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_6px_rgba(0,0,0,1)] drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] leading-tight`}
                >
                  {shortHeadlineText}
                </div>
                {description && description !== shortHeadlineText && (
                  <div
                    className={`font-display text-xs sm:text-sm font-bold mt-1 text-white/90 ${resolvedStyle.glowColor} drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-1`}
                  >
                    {description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* F. CORNER GLIDE */}
          {resolvedStyle.motionType === 'corner-glide' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4">
              <div className="animate-billboard-corner-glide text-center">
                <div
                  className={`font-display ${resolvedStyle.fontSizeClass} tracking-wide ${resolvedStyle.textColor} ${resolvedStyle.glowColor} drop-shadow-[0_2px_5px_rgba(0,0,0,1)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]`}
                >
                  {shortHeadlineText}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 6. SUBTLE SLIDESHOW DOTS */}
      {validImages.length > 1 && (
        <div className="absolute top-2 inset-x-0 z-20 flex items-center justify-center gap-1 pointer-events-none">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 rounded-full transition-all ${
                activeImageIndex === i ? 'w-3 bg-amber-400' : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
