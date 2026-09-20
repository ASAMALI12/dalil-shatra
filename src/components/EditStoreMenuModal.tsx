import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Tag,
  Camera,
  UtensilsCrossed,
  Sparkles,
  Check,
  Upload,
} from 'lucide-react';
import { DirectoryItem, StoreMenuItem } from '../types/shatrah';
import { getStoreMenu } from '../utils/storeMenuHelper';

interface EditStoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DirectoryItem;
  onSave: (menu: StoreMenuItem[], menuImages: string[]) => void;
}

// Compress image helper
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const EditStoreMenuModal: React.FC<EditStoreMenuModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  // Initialize with existing menu or authentic default
  const [items, setItems] = useState<StoreMenuItem[]>(() => {
    return Array.isArray(item.menu) && item.menu.length > 0
      ? item.menu
      : getStoreMenu(item);
  });

  const [menuImages, setMenuImages] = useState<string[]>(() => {
    return Array.isArray(item.menuImages) ? item.menuImages : [];
  });

  // New item form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice.trim()) return;

    const formattedPrice = newPrice.trim().includes('د.ع')
      ? newPrice.trim()
      : `${newPrice.trim()} د.ع`;

    const newItem: StoreMenuItem = {
      id: `menu-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newName.trim(),
      price: formattedPrice,
      category: newCategory.trim() || 'أصناف متنوعة',
      description: newDesc.trim() || undefined,
      popular: isPopular,
    };

    setItems((prev) => [newItem, ...prev]);
    setNewName('');
    setNewPrice('');
    setNewCategory('');
    setNewDesc('');
    setIsPopular(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newImages.push(compressed);
      }
      setMenuImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Error uploading menu photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setMenuImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAll = () => {
    onSave(items, menuImages);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                إدارة وتعديل منيو وأسعار: {item.name}
              </h3>
              <p className="text-[10px] text-slate-500">
                أضف منتجاتك وأسعارك وصور المنيو لتظهر لزبائنك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-right">
          {/* Form: Add New Item */}
          <form
            onSubmit={handleAddItem}
            className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-amber-700" />
                <span>إضافة صنف أو خدمة جديدة للقائمة:</span>
              </span>
              <span className="text-[10px] text-amber-800">حقول مطلوبة (*)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم الوجبة / المنتج / الخدمة *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: كباب عراقي / شاشة آيفون / كشفية"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  السعر بالدينار العراقي *
                </label>
                <input
                  type="text"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="مثال: 12,000 د.ع أو 15000"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  القسم / التصنيف
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="مثال: وجبات رئيسية / صيانة / مشروبات"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="popularCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  تمييز كصنف شائع / الأكثر طلباً ⭐
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                وصف اختياري (المكونات أو تفاصيل الخدمة)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="مثال: مع صمون حار وسيرفيس مقبلات كاملة"
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-hidden focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>إدراج الصنف في القائمة</span>
            </button>
          </form>

          {/* Menu Photos Upload Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-sky-600" />
                <span>صور المنيو أو القائمة الورقية:</span>
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-3 w-3" />
                <span>{isUploadingPhoto ? 'جارٍ الرفع...' : 'رفع صورة منيو 📸'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {menuImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {menuImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-white group"
                  >
                    <img src={img} alt="منيو" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 left-1 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      title="حذف الصورة"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-display text-xs font-black text-slate-900">
                الأصناف المسجلة حالياً ({items.length})
              </span>
              <span className="text-[10px] text-slate-400">
                يمكنك حذف أي صنف بالضغط على سلة المهملات
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </span>
                      {item.popular && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                          شائع
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="text-emerald-700 font-bold font-mono">{item.price}</span>
                      {item.category && <span>• {item.category}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف هذا الصنف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 p-3 shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-black shadow-xs transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>حفظ المنيو والأسعار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
