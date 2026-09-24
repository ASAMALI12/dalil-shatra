import React, { useState, useMemo } from 'react';
import { X, Search, ChevronLeft, ArrowRight, MapPin, Globe } from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useLocation } from '../context/LocationContext';
import { getStoreCanonicalCategory } from '../utils/categoryMatcher';

interface CategoryListModalProps {
  categoryId: string | null;
  categoryTitle: string;
  onClose: () => void;
  onSelectItem: (item: DirectoryItem) => void;
}

export const CategoryListModal: React.FC<CategoryListModalProps> = ({
  categoryId,
  categoryTitle,
  onClose,
  onSelectItem,
}) => {
  const { items } = useDirectory();
  const { currentLocation } = useLocation();
  const [search, setSearch] = useState('');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [locationScope, setLocationScope] = useState<'local' | 'all'>('local');

  const filteredItems = useMemo(() => {
    if (!categoryId) return [];

    let list = items.filter((item) => {
      const canonical = getStoreCanonicalCategory(item);
      if (categoryId === 'doctors') return canonical === 'medical';
      if (categoryId === 'pharmacies') return canonical === 'medical' && (item.category === 'pharmacies' || (item.name && item.name.includes('صيدلية')));
      if (categoryId === 'restaurants') return canonical === 'restaurants' || canonical === 'cafes';
      if (categoryId === 'services') return canonical === 'services';
      if (categoryId === 'beauty') return item.category === 'beauty' || (item.name && (item.name.includes('صالون') || item.name.includes('كوافير') || item.name.includes('تجميل')));
      if (categoryId === 'other') {
        return (
          canonical === 'used-goods' ||
          canonical === 'lost-found' ||
          canonical === 'jobs' ||
          canonical === 'automotive' ||
          (!['medical', 'clothing', 'restaurants', 'cafes', 'electronics', 'services', 'supermarkets'].includes(canonical))
        );
      }
      return canonical === categoryId;
    });

    // Location Scope
    if (locationScope === 'local' && currentLocation.governorateId) {
      const localMatches = list.filter(
        (i) => i.governorateId === currentLocation.governorateId
      );
      // If there are local matches, show them; otherwise fallback to showing all
      if (localMatches.length > 0) {
        list = localMatches;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description?.toLowerCase().includes(q) ?? false) ||
          (i.address?.toLowerCase().includes(q) ?? false) ||
          (i.subCategory?.toLowerCase().includes(q) ?? false) ||
          (i.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      );
    }

    if (filterOpenOnly) {
      list = list.filter((i) => i.isOpen);
    }

    return list;
  }, [items, categoryId, search, filterOpenOnly, locationScope, currentLocation.governorateId]);

  if (!categoryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer shadow-2xs"
              title="العودة للقائمة السابقة"
            >
              <ArrowRight className="h-4 w-4 text-red-600" />
              <span>رجوع</span>
            </button>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {categoryTitle}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                {filteredItems.length} أماكن متاحة في دليل العراق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 border-b border-slate-100 bg-white space-y-2.5">
          <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`ابحث داخل ${categoryTitle}...`}
              className="w-full bg-transparent px-2 font-display text-xs sm:text-sm font-medium text-slate-800 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setLocationScope('local')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                locationScope === 'local'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span>في {currentLocation.governorateName}</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationScope('all')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                locationScope === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>كل العراق</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterOpenOnly(!filterOpenOnly)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterOpenOnly
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>مفتوح الآن فقط</span>
            </button>
          </div>
        </div>

        {/* Items List - Clean, enlarged image & clear name */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
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
                  <h4 className="font-display text-base sm:text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                    {item.name}
                  </h4>
                </div>

                {/* Left Arrow Icon indicating click to open store profile */}
                <div className="shrink-0 pl-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-red-50 text-slate-400 group-hover:text-red-600 transition-all shadow-2xs">
                    <ChevronLeft className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold">لم يتم العثور على نتائج في هذا القسم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
