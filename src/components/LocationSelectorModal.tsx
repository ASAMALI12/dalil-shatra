import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import {
  MapPin,
  Compass,
  Check,
  X,
  Navigation,
  Search,
  Sparkles,
  Loader2,
  ChevronLeft,
} from 'lucide-react';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (governorateId: string, districtId: string, districtName: string) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const {
    currentLocation,
    governorates,
    changeLocation,
    setAllDistrictsForGovernorate,
    detectGPSLocation,
    isDetectingGPS,
    gpsStatusMessage,
  } = useLocation();

  const [activeGovId, setActiveGovId] = useState<string>(currentLocation.governorateId);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const selectedGov = governorates.find((g) => g.id === activeGovId) || governorates[0];

  const filteredGovs = governorates.filter((g) =>
    g.name.includes(searchTerm.trim()) || g.districts.some((d) => d.name.includes(searchTerm.trim()))
  );

  const handleSelectDistrict = (govId: string, distId: string, distName: string) => {
    changeLocation(govId, distId);
    if (onSelectLocation) {
      onSelectLocation(govId, distId, distName);
    }
    onClose();
  };

  const handleSelectAllDistricts = (govId: string, govName: string) => {
    setAllDistrictsForGovernorate(govId);
    if (onSelectLocation) {
      onSelectLocation(govId, 'all', `كل ${govName}`);
    }
    onClose();
  };

  const handleTriggerGPS = () => {
    detectGPSLocation(true, (loc) => {
      if (onSelectLocation) {
        onSelectLocation(loc.governorateId, loc.districtId, loc.districtName);
      }
      onClose();
    });
  };

  return (
    <div
      id="location-selector-modal-backdrop"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="location-selector-modal-card"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">تحديد منطقتك في العراق</h3>
                <p className="text-xs text-emerald-100">
                  الموقع الحالي: {currentLocation.governorateName} - {currentLocation.districtName}
                </p>
              </div>
            </div>
            <button
              id="close-location-modal-btn"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick GPS Auto-Detect Button */}
          <div className="mt-3">
            <button
              id="gps-auto-detect-btn"
              onClick={handleTriggerGPS}
              disabled={isDetectingGPS}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:bg-emerald-50 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer"
            >
              {isDetectingGPS ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>جاري تحديد موقعك بالأقمار الصناعية (GPS)...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                  <span>تحديد موقعي التلقائي عبر GPS ونقلي لمدينتي 🛰️</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Message */}
          {gpsStatusMessage && (
            <div className="mt-2 text-xs bg-emerald-800/80 rounded-lg py-1.5 px-3 text-center border border-emerald-400/30 text-emerald-50 animate-in fade-in">
              {gpsStatusMessage}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="search-governorate-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن محافظتك أو قضائك (مثال: الشطرة، المنصور، الزبير)..."
              className="w-full pr-10 pl-4 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Content: Two Columns on desktop, or Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
          {/* Column 1: Governorates List */}
          <div className="md:w-5/12 overflow-y-auto max-h-[35vh] md:max-h-[50vh] p-2 space-y-1 bg-slate-50/50">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              اختر المحافظة (15 محافظة)
            </div>
            {filteredGovs.map((gov) => {
              const isSelected = gov.id === activeGovId;
              const isCurrent = gov.id === currentLocation.governorateId;

              return (
                <button
                  key={gov.id}
                  id={`gov-select-${gov.id}`}
                  onClick={() => setActiveGovId(gov.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : isCurrent
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <span>{gov.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCurrent && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        الحالية
                      </span>
                    )}
                    <ChevronLeft
                      className={`h-4 w-4 transition-transform ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Column 2: Districts and Subdistricts */}
          <div className="flex-1 overflow-y-auto max-h-[45vh] md:max-h-[50vh] p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>أقضية ونواحي</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    {selectedGov.name}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedGov.tagline}</p>
              </div>

              <button
                id={`all-districts-btn-${selectedGov.id}`}
                onClick={() => handleSelectAllDistricts(selectedGov.id, selectedGov.name)}
                className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1.5 rounded-xl font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                عرض كل {selectedGov.name}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selectedGov.districts.map((district) => {
                const isSelected =
                  currentLocation.governorateId === selectedGov.id &&
                  currentLocation.districtId === district.id;

                return (
                  <button
                    key={district.id}
                    id={`district-select-${district.id}`}
                    onClick={() => handleSelectDistrict(selectedGov.id, district.id, district.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col text-right truncate">
                      <span className="text-xs font-semibold truncate group-hover:text-emerald-700">
                        {district.name}
                      </span>
                      {district.isCenter && (
                        <span className="text-[10px] text-slate-400">مركز المحافظة</span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>دليل العراق يشمل 15 محافظة بجميع أقضيتها</span>
          <button
            id="close-location-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
