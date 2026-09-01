import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeroAdBannerProps {
  onOpenAdModal: () => void;
}

export const HeroAdBanner: React.FC<HeroAdBannerProps> = ({ onOpenAdModal }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-5 sm:p-7 shadow-lg shadow-red-500/20 text-white">
      {/* Background Matrix Dot Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative z-10 flex flex-row items-center justify-between gap-4">
        {/* Left Side: 3D Megaphone Graphic with dynamic sound rays */}
        <div className="relative flex-shrink-0">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center">
            {/* 3D Red & White Megaphone SVG */}
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Yellow Sound Burst */}
              <path d="M75 30L85 24" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
              <path d="M80 48L92 48" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
              <path d="M75 66L85 72" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />

              {/* Megaphone Cone Body */}
              <path d="M35 34L68 20V76L35 62V34Z" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M68 20C73 20 76 32 76 48C76 64 73 76 68 76V20Z" fill="#B91C1C" stroke="#FFFFFF" strokeWidth="2.5" />
              
              {/* Megaphone Back Base */}
              <rect x="22" y="38" width="13" height="20" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
              <circle cx="22" cy="48" r="5" fill="#EF4444" />
              
              {/* Megaphone Handle */}
              <path d="M28 58L22 78C22 80 25 82 28 82L32 82C35 82 36 80 35 78L31 58" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
              
              {/* Strap clip */}
              <rect x="24" y="66" width="9" height="3" fill="#94A3B8" rx="1" />
            </svg>
          </div>
        </div>

        {/* Right Side: Headline and CTA button */}
        <div className="flex flex-col items-center sm:items-end text-center sm:text-right flex-grow">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight text-white mb-3">
            ضع إعلانك هنا
            <br />
            <span className="text-white drop-shadow-xs">ليشاهده جميع الزوار</span>
          </h2>

          {/* Action Button: White pill with red text and red circular arrow icon */}
          <button
            type="button"
            onClick={onOpenAdModal}
            className="group flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 font-display text-sm sm:text-base font-bold text-red-600 shadow-md hover:bg-red-50 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-transform group-hover:-translate-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span>اضغط هنا للإعلان</span>
          </button>

          {/* Subtext */}
          <p className="mt-2 text-[11px] sm:text-xs font-semibold text-red-100 opacity-90">
            سيتم توجيهك إلى صفحة الدفع
          </p>
        </div>
      </div>
    </div>
  );
};
