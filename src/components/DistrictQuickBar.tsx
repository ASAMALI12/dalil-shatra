import React from 'react';
import { MapPin, SlidersHorizontal, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';

export const DistrictQuickBar: React.FC = () => {
  const {
    currentLocation,
    setDistrict,
    openLocationModal,
    detectGPSLocation,
    isDetectingGPS,
  } = useLocation();

  const currentGov = IRAQ_GOVERNORATES.find(
    (g) => g.id === currentLocation.governorateId
  );

  if (!currentGov) return null;

  return (
    <div className="space-y-1.5">
      {/* Top row: Current Governorate & Districts with Quick Action */}
      <div className="flex items-center justify-between text-xs px-0.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>أقضية ونواحي {currentGov.name}:</span>
        </div>

        <button
          type="button"
          onClick={openLocationModal}
          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>تغيير المحافظة ({IRAQ_GOVERNORATES.length})</span>
        </button>
      </div>

      {/* Horizontal Scroller of District Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* "All" chip */}
        <button
          type="button"
          onClick={() => setDistrict('all', 'جميع الأقضية')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            currentLocation.districtId === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          كل {currentGov.name}
        </button>

        {/* Specific Districts */}
        {currentGov.districts.map((district) => {
          const isSelected = currentLocation.districtId === district.id;
          return (
            <button
              key={district.id}
              type="button"
              onClick={() => setDistrict(district.id, district.name)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {district.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
