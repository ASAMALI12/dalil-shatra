import React from 'react';
import { IRAQ_GOVERNORATES_CARDS } from '../data/iraqGovernoratesCards';

interface IraqGovernoratesGridProps {
  onSelectGovernorate: (governorateId: string) => void;
}

export const IraqGovernoratesGrid: React.FC<IraqGovernoratesGridProps> = ({
  onSelectGovernorate,
}) => {
  return (
    <div className="space-y-3">
      {/* 3-Column Grid matching Screenshot 1 with larger icons and high-clarity cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {IRAQ_GOVERNORATES_CARDS.map((gov) => (
          <div
            key={gov.id}
            onClick={() => onSelectGovernorate(gov.id)}
            className="group relative flex flex-col items-center justify-between rounded-3xl border-2 border-slate-200/90 hover:border-sky-400 bg-white p-3 sm:p-3.5 text-center shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 select-none"
          >
            {/* Enlarged Landmark / Symbol matching user request */}
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-50 to-blue-50/70 border border-sky-100/90 shadow-2xs mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-3xl sm:text-4xl select-none filter drop-shadow-xs">
                {gov.symbol}
              </span>
            </div>

            {/* High-Clarity Governorate Name */}
            <h3 className="font-display text-sm sm:text-base font-black text-slate-900 tracking-tight truncate w-full group-hover:text-sky-700 transition-colors">
              {gov.name}
            </h3>

            {/* Clear Tagline / Subtitle */}
            <p className="text-[11px] sm:text-xs text-slate-600 font-bold truncate w-full mt-0.5 leading-tight">
              {gov.tagline}
            </p>

            {/* High-Clarity "اختيار" Button */}
            <button
              type="button"
              className="mt-2.5 w-full rounded-xl bg-sky-50/90 hover:bg-sky-100 text-sky-700 font-black py-2 px-2 text-xs border border-sky-200/80 transition-all cursor-pointer shadow-2xs group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600"
            >
              اختيار
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
