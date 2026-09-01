import React, { useState, useMemo } from 'react';
import { X, Search, Star, Phone, MapPin, Filter, ArrowRight, Trash2 } from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useWallet } from '../context/WalletContext';

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
  const { items, deleteStore } = useDirectory();
  const { isManagerUnlocked } = useWallet();
  const [search, setSearch] = useState('');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!categoryId) return [];

    let list = items.filter((item) => {
      if (categoryId === 'other') return true;
      return item.category === categoryId;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.subCategory?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filterOpenOnly) {
      list = list.filter((i) => i.isOpen);
    }

    return list;
  }, [items, categoryId, search, filterOpenOnly]);

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
                {filteredItems.length} أماكن متاحة في دليل الشطرة
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

          <div className="flex items-center gap-2">
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

        {/* Items List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="relative h-20 w-24 sm:h-20 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {item.isOpen ? (
                      <span className="absolute top-1 right-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        مفتوح
                      </span>
                    ) : (
                      <span className="absolute top-1 right-1 rounded-md bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        مغلق
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {item.subCategory || 'دليل الشطرة'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    <h4 className="mt-1 font-display text-sm sm:text-base font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 truncate">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        {item.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manager Delete Button (If Manager Mode is Active) */}
                {isManagerUnlocked && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end"
                  >
                    {deletingId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            deleteStore(item.id);
                            setDeletingId(null);
                          }}
                          className="bg-rose-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-rose-700"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-slate-500 text-[11px] px-1.5 py-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                        title="حذف المتجر كمدير"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                )}
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
