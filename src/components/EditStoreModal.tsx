import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Save,
  CheckCircle,
  Camera,
  Tag,
  Plus,
  Percent,
  Sparkles,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';

interface EditStoreModalProps {
  store: DirectoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedStore: DirectoryItem) => void;
  onUpdated?: (updatedStore: DirectoryItem) => void;
}

export const EditStoreModal: React.FC<EditStoreModalProps> = ({
  store,
  isOpen,
  onClose,
  onSaved,
  onUpdated,
}) => {
  const { updateStore, categories } = useDirectory();
  const { addNotification } = useNotification();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [successSaved, setSuccessSaved] = useState(false);

  // Quick offer state
  const [offerTitle, setOfferTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15%');
  const [offerType, setOfferType] = useState<'discount' | 'new_item' | 'special_deal' | 'service'>('discount');
  const [offerScope, setOfferScope] = useState<'district' | 'governorate' | 'iraq'>('district');
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (store && isOpen) {
      setName(store.name || '');
      setCategory(store.category || 'restaurants');
      setSubCategory(store.subCategory || '');
      setPhone(store.phone || '');
      setWhatsapp(store.whatsapp || '');
      setAddress(store.address || '');
      setWorkingHours(store.workingHours || '');
      setDescription(store.description || '');
      setImageUrl(store.imageUrl || '');
      setIsOpenNow(store.isOpen ?? true);
      setSuccessSaved(false);
      setShowAddOffer(false);
      setOfferScope('district');
    }
  }, [store, isOpen]);

  if (!isOpen || !store) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('اسم المتجر مطلوب');
      return;
    }
    if (!phone.trim()) {
      alert('رقم هاتف المتجر مطلوب');
      return;
    }

    const updatedData: Partial<DirectoryItem> = {
      name: name.trim(),
      category,
      subCategory: subCategory.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || `964${phone.trim().replace(/^0/, '')}`,
      address: address.trim(),
      workingHours: workingHours.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || store.imageUrl,
      isOpen: isOpenNow,
    };

    updateStore(store.id, updatedData);
    setSuccessSaved(true);

    const fullUpdatedStore: DirectoryItem = {
      ...store,
      ...updatedData,
    };

    if (onSaved) {
      onSaved(fullUpdatedStore);
    }
    if (onUpdated) {
      onUpdated(fullUpdatedStore);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    setIsBroadcasting(true);

    const typePrefix =
      offerType === 'new_item'
        ? '🍱 وجبة / صنف جديد:'
        : offerType === 'service'
        ? '🛠️ خدمة جديدة:'
        : offerType === 'special_deal'
        ? '⭐ باقة وعرض خاص:'
        : '🏷️ خصم وتخفيض:';

    const scopeLabel =
      offerScope === 'district'
        ? `قضاء ${store.districtName || 'منطقتك'}`
        : offerScope === 'governorate'
        ? `عموم محافظة ${store.governorateName || 'المحافظة'}`
        : 'كافة محافظات العراق 🇮🇶';

    const fullTitle = `${typePrefix} ${name}`;
    const fullMessage = `${offerTitle.trim()} (${discountPercent || 'عرض خاص'}) - متوفر الآن لدى ${name} (${store.districtName || 'المنطقة'}، ${store.governorateName || 'المحافظة'})!`;

    addNotification({
      title: fullTitle,
      message: fullMessage,
      type: 'offer',
      targetId: store.id,
      storeId: store.id,
      targetType: 'store',
      badge: discountPercent || 'عرض خاص',
      imageUrl: imageUrl || store.imageUrl,
      targetScope: offerScope,
      targetGovernorateId: store.governorateId,
      targetDistrictId: store.districtId,
      governorateId: store.governorateId,
      governorateName: store.governorateName,
      districtId: store.districtId,
      districtName: store.districtName,
      categoryId: store.category,
      createdAt: new Date().toISOString(),
    });

    setIsBroadcasting(false);
    alert(`تم بنجاح بث الإشعار إلى [${scopeLabel}] وحفظه في سجل إشعارات الدليل! 🎉`);
    setOfferTitle('');
    setShowAddOffer(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">
                إدارة وتعديل بيانات المتجر 👑
              </h3>
              <p className="text-[11px] text-slate-300">
                {store.name} • لوحة تحكم المالك المعتمد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {successSaved && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 flex items-center gap-2.5 text-emerald-800 font-bold text-xs animate-in fade-in">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span>تم حفظ وتحديث بيانات المتجر بنجاح في الدليل!</span>
            </div>
          )}

          {/* Quick Offer Publisher Button */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="font-display text-xs font-bold text-amber-900">
                  إطلاق عرض أو خصم خاص للمحل
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOffer(!showAddOffer)}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                {showAddOffer ? 'إلغاء' : '+ إضافة عرض وبث إشعار'}
              </button>
            </div>

            {showAddOffer && (
              <form onSubmit={handlePublishOffer} className="p-3 bg-white rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                {/* 1. Update / Offer Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    نوع الإعلان / التحديث
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 text-center">
                    <button
                      type="button"
                      onClick={() => setOfferType('discount')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                        offerType === 'discount'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏷️ خصم وتخفيض
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('new_item')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                        offerType === 'new_item'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🍱 وجبة / صنف جديد
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('special_deal')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                        offerType === 'special_deal'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⭐ باقة وعرض
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('service')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                        offerType === 'service'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🛠️ خدمة جديدة
                    </button>
                  </div>
                </div>

                {/* 2. Notification Geographic Target Scope */}
                <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                  <label className="block text-[11px] font-bold text-amber-950 mb-1.5">
                    📍 نطاق وصول الإشعار (الاستهداف الجغرافي):
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="offerScope"
                        checked={offerScope === 'district'}
                        onChange={() => setOfferScope('district')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>قضاء المتجر فقط ({store.districtName || 'المنطقة الحالية'}) <strong className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded-md">موصى به</strong></span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="offerScope"
                        checked={offerScope === 'governorate'}
                        onChange={() => setOfferScope('governorate')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>عموم محافظة {store.governorateName || 'المحافظة'}</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="offerScope"
                        checked={offerScope === 'iraq'}
                        onChange={() => setOfferScope('iraq')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>كافة أنحاء العراق (إشعار عام)</span>
                    </label>
                  </div>
                </div>

                {/* 3. Title & Badge */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    تفاصيل الإعلان أو التحديث *
                  </label>
                  <input
                    type="text"
                    required
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder="مثال: خصم 20% على جميع الوجبات أو وصول وجبة برغر جديدة"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      شارة العرض (الخصم أو الميزة)
                    </label>
                    <input
                      type="text"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="مثال: خصم 20% أو وجبة طازجة"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-red-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="mt-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {isBroadcasting ? 'جارِ البث...' : 'بث الإشعار الجغرافي 📢'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Store Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  اسم المتجر *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  القسم الرئيسي
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SubCategory */}
            <div>
              <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                التخصص الدقيق
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="مثال: مأكولات شرقية، أزياء..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Phone & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:border-red-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  رقم الواتساب
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="964780xxxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono text-slate-800 focus:border-red-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Address & Working Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  عنوان المتجر / الحي أو الشارع
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  أوقات العمل
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                الوصف والخدمات
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            {/* Open / Closed status */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">حالة النشاط حالياً:</span>
              <button
                type="button"
                onClick={() => setIsOpenNow(!isOpenNow)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isOpenNow
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {isOpenNow ? '✓ مفتوح للزبائن' : '✕ مغلق حالياً'}
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>حفظ التعديلات في الدليل</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
