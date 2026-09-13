import React, { useState, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Governorate } from '../data/iraqLocations';
import { IRAQ_GOVERNORATES_CARDS } from '../data/iraqGovernoratesCards';
import { DistrictsAnimatedAdBanner } from './DistrictsAnimatedAdBanner';
import { DirectoryItem } from '../types/directory';

interface DistrictsCircularViewProps {
  governorate: Governorate;
  onBack?: () => void;
  onHome?: () => void;
  onSelectDistrict: (districtId: string, districtName: string) => void;
  onOpenClaimStoreModal?: (store?: DirectoryItem) => void;
}

// Vibrant circular background styles matching Screenshot 2
const CIRCLE_COLOR_PALETTE = [
  'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200',
  'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
  'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
  'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200',
  'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200',
  'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
  'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200',
  'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
  'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200',
  'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200',
];

const DISTRICT_ICONS = ['🏙️', '📍', '🏛️', '🏬', '🌟', '🌳', '🕌', '🏰', '✨', '🧭'];

export const DistrictsCircularView: React.FC<DistrictsCircularViewProps> = ({
  governorate,
  onBack,
  onSelectDistrict,
  onOpenClaimStoreModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return governorate.districts;
    const q = searchQuery.toLowerCase().trim();
    return governorate.districts.filter((d) => d.name.toLowerCase().includes(q));
  }, [governorate.districts, searchQuery]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* المربع الإعلاني لصفحة المدن بسعر 15 ألف دينار مع انيميشن خاص */}
      <DistrictsAnimatedAdBanner
        governorateName={governorate.name}
        onOpenClaimStoreModal={onOpenClaimStoreModal}
      />

      {/* Top Header with Back Navigation to All Governorates */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
            <span>رجوع للمحافظات</span>
          </button>
        ) : (
          <div />
        )}
        <div className="text-center">
          <h3 className="font-display text-xs sm:text-sm font-extrabold text-slate-900">
            أقضية ونواحي {governorate.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onSelectDistrict('all', `كل ${governorate.name}`)}
          className="rounded-xl bg-sky-50 border border-sky-200 px-2.5 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-100 transition-all cursor-pointer"
        >
          عرض الكل
        </button>
      </div>

      {/* Quick Search for Districts */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
          <Search className="h-3.5 w-3.5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`ابحث في أقضية ونواحي ${governorate.name}...`}
          className="w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pr-9 pl-4 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all text-right"
        />
      </div>

      {/* Main White Card with Circular Grid matching Screenshot 2 */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-6">
        {/* Subheader info banner */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
          <span className="font-bold text-slate-800">
            اختر المنطقة من {governorate.name} ({filteredDistricts.length})
          </span>
        </div>

        {/* 2-Column Circular Grid precisely matching Screenshot 2 */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:gap-x-8 justify-items-center">
          {filteredDistricts.map((district, idx) => {
            const colorClass = CIRCLE_COLOR_PALETTE[idx % CIRCLE_COLOR_PALETTE.length];
            const icon = DISTRICT_ICONS[idx % DISTRICT_ICONS.length];

            return (
              <div
                key={district.id}
                onClick={() => onSelectDistrict(district.id, district.name)}
                className="group flex flex-col items-center cursor-pointer transition-all duration-200 active:scale-95 w-full max-w-[140px]"
              >
                {/* Circular Button matching Screenshot 2 */}
                <div
                  className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full ${colorClass} shadow-md transition-transform group-hover:scale-105 duration-200`}
                >
                  <span className="text-3xl sm:text-4xl">{icon}</span>
                </div>

                {/* Label under the circle */}
                <span className="mt-2.5 text-center font-display text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors line-clamp-2 px-1">
                  {district.name}
                </span>

                {district.isCenter && (
                  <span className="mt-0.5 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                    المركز
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            اختر المنطقة لعرض المتاجر والأطباء والخدمات المتاحة فيها
          </p>
        </div>
      </div>
    </div>
  );
};
