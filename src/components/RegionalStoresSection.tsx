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
  ChevronLeft,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useLocation } from '../context/LocationContext';
import { openSocialMediaLink } from '../utils/socialLinks';

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

      {/* Stores Grid / Cards - Clean, enlarged image & clear name */}
      <div className="space-y-3">
        {localStores.length > 0 ? (
          localStores.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group relative flex items-center gap-4 rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99]"
              >
                {/* Enlarged Store / Restaurant Image */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200/90 shadow-2xs">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Restaurant / Store Name - Prominent & Beautiful */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-display text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                    {item.name}
                  </h4>
                </div>

                {/* Left Arrow Icon indicating click to open store profile */}
                <div className="shrink-0 pl-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-all shadow-2xs">
                    <ChevronLeft className="h-5 w-5" />
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
