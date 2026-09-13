import React, { useState, useMemo } from 'react';
import {
  Store,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  ExternalLink,
  Crown,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useLocation } from '../context/LocationContext';

interface RegionalStoresSectionProps {
  onSelectItem: (item: DirectoryItem) => void;
  onClaimStore: (store: DirectoryItem) => void;
  onOpenStoreModal: () => void;
}

export const RegionalStoresSection: React.FC<RegionalStoresSectionProps> = ({
  onSelectItem,
  onClaimStore,
  onOpenStoreModal,
}) => {
  const { items, isUserStoreOwner } = useDirectory();
  const { currentLocation } = useLocation();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);

  // Filter items based on active location and category
  const { localStores, governorateFallbackStores } = useMemo(() => {
    // 1. Stores strictly in this governorate (matching both ID and Arabic Name)
    const govStores = items.filter(
      (item) =>
        item.governorateId === currentLocation.governorateId ||
        (item.governorateName &&
          currentLocation.governorateName &&
          item.governorateName.trim() === currentLocation.governorateName.trim())
    );

    // 2. Stores strictly in this district (if not 'all')
    let districtStores = govStores;
    if (currentLocation.districtId && currentLocation.districtId !== 'all') {
      const matchDistrict = govStores.filter(
        (item) =>
          item.districtId === currentLocation.districtId ||
          (item.districtName &&
            currentLocation.districtName &&
            item.districtName.trim() === currentLocation.districtName.trim())
      );
      if (matchDistrict.length > 0) {
        districtStores = matchDistrict;
      }
    }

    // Apply category & open now filters
    const applyFilters = (list: DirectoryItem[]) => {
      let res = list;
      if (selectedCategoryFilter !== 'all') {
        res = res.filter((item) => {
          const itemCat = (item.category || '').toLowerCase();
          if (itemCat === selectedCategoryFilter) return true;
          if (selectedCategoryFilter === 'doctors' && (itemCat.includes('طبيب') || itemCat.includes('دكتور') || itemCat.includes('صحة') || itemCat.includes('عياد') || itemCat.includes('health'))) return true;
          if (selectedCategoryFilter === 'restaurants' && (itemCat.includes('مطعم') || itemCat.includes('كافيه') || itemCat.includes('اكل') || itemCat.includes('food') || itemCat.includes('cafe'))) return true;
          if (selectedCategoryFilter === 'clothing' && (itemCat.includes('ملابس') || itemCat.includes('أزياء') || itemCat.includes('ازياء') || itemCat.includes('fashion') || itemCat.includes('البسة'))) return true;
          if (selectedCategoryFilter === 'electronics' && (itemCat.includes('إلكترون') || itemCat.includes('الكترون') || itemCat.includes('موبايل') || itemCat.includes('هواتف') || itemCat.includes('تقنية'))) return true;
          if (selectedCategoryFilter === 'services' && (itemCat.includes('خدم') || itemCat.includes('صيانة') || itemCat.includes('service'))) return true;
          return false;
        });
      }
      if (openNowOnly) {
        res = res.filter((item) => item.isOpen);
      }
      return res;
    };

    return {
      localStores: applyFilters(districtStores),
      governorateFallbackStores: applyFilters(govStores),
    };
  }, [items, currentLocation, selectedCategoryFilter, openNowOnly]);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'doctors', label: '🩺 أطباء وصحة' },
    { id: 'restaurants', label: '🍔 مطاعم وكافيهات' },
    { id: 'clothing', label: '👗 أزياء وألبسة' },
    { id: 'electronics', label: '📱 إلكترونيات' },
    { id: 'services', label: '🔧 خدمات وصيانة' },
  ];

  return (
    <section className="space-y-3 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 leading-tight">
              متاجر وأنشطة {currentLocation.districtName !== 'all' ? currentLocation.districtName : currentLocation.governorateName}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {localStores.length} متجر متاح في نطاقك
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenStoreModal}
          className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
        >
          <span>+ أضف متجرك</span>
        </button>
      </div>

      {/* Category Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategoryFilter(cat.id)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === cat.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{cat.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setOpenNowOnly(!openNowOnly)}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
            openNowOnly
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>مفتوح الآن 🟢</span>
        </button>
      </div>

      {/* Stores Grid / Cards */}
      <div className="space-y-3">
        {localStores.length > 0 ? (
          localStores.map((item) => {
            const isOwner = isUserStoreOwner(item.id);
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex gap-3">
                  {/* Store Image */}
                  <div
                    onClick={() => onSelectItem(item)}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer bg-slate-100"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 right-1">
                      {item.isOpen ? (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-slate-400 ring-2 ring-white" />
                      )}
                    </div>
                  </div>

                  {/* Store Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h4
                          onClick={() => onSelectItem(item)}
                          className="font-display text-sm font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                        >
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                          <span>{item.subCategory || item.category}</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60 flex-shrink-0">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Address & District Tag */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                      <MapPin className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                      {item.districtName && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 flex-shrink-0">
                          {item.districtName}
                        </span>
                      )}
                    </div>

                    {/* Action Bar (Direct Contact buttons) */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap">
                      {/* Call Direct */}
                      <a
                        href={`tel:${item.phone}`}
                        className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 text-xs font-bold transition-all shadow-2xs"
                        title="اتصال مباشر"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>اتصال</span>
                      </a>

                      {/* WhatsApp Direct */}
                      <a
                        href={`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(`مرحباً، شاهدت متجركم ${item.name} في دليل العراق الذكي.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs font-bold transition-all shadow-2xs"
                        title="مراسلة واتساب"
                      >
                        <MessageCircle className="h-3 w-3 text-emerald-600" />
                        <span>واتساب</span>
                      </a>

                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer mr-auto"
                      >
                        <span>التفاصيل</span>
                      </button>

                      {/* Store Ownership Status or Claim Button */}
                      {isOwner ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span>متجرك الموثق</span>
                        </span>
                      ) : !item.isClaimed ? (
                        <button
                          type="button"
                          onClick={() => onClaimStore(item)}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          وثّق هذا المتجر 👑
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              📍
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-800">
                لا توجد متاجر مسجلة في {currentLocation.districtName} حالياً
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                كن أول من يضيف متجره في هذه المنطقة مجاناً بدون تسجيل حساب مع تأكيد الواتساب!
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenStoreModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <Store className="h-3.5 w-3.5" />
              <span>أضف متجرك في {currentLocation.districtName} مجاناً</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
