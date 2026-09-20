import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  Percent,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Compass,
  Navigation,
  Globe,
  Share2,
  UtensilsCrossed,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { DirectoryItem, StoreMenuItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';

// Compress image file helper
const compressImageFile = (file: File): Promise<string> => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

interface EditStoreModalProps {
  store: DirectoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedStore: DirectoryItem) => void;
  onUpdated?: (updatedStore: DirectoryItem) => void;
}

type TabType = 'basic_location' | 'contact_social' | 'photos' | 'menu' | 'offers';

export const EditStoreModal: React.FC<EditStoreModalProps> = ({
  store,
  isOpen,
  onClose,
  onSaved,
  onUpdated,
}) => {
  const { updateStore, categories } = useDirectory();
  const { addNotification } = useNotification();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('basic_location');

  // 1. Basic Information
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [governorateName, setGovernorateName] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [description, setDescription] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [isOpenNow, setIsOpenNow] = useState(true);

  // 2. Address & Accurate Map Location
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // 3. Contact & Social Links
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');

  // 4. Photos & Cover
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  // 5. Menu & Price List
  const [menuItems, setMenuItems] = useState<StoreMenuItem[]>([]);
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [isMenuPopular, setIsMenuPopular] = useState(false);
  const [isUploadingMenuPhoto, setIsUploadingMenuPhoto] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement | null>(null);

  // 6. Offer broadcast state
  const [offerTitle, setOfferTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15%');
  const [offerType, setOfferType] = useState<'discount' | 'new_item' | 'special_deal' | 'service'>('discount');
  const [offerScope, setOfferScope] = useState<'district' | 'governorate' | 'iraq'>('district');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Success indicator
  const [successSaved, setSuccessSaved] = useState(false);

  // Populate state on open
  useEffect(() => {
    if (store && isOpen) {
      setName(store.name || '');
      setCategory(store.category || 'restaurants');
      setSubCategory(store.subCategory || '');

      // Governorate & District
      const govId = store.governorateId || 'dhi-qar';
      setGovernorateId(govId);
      const govObj = IRAQ_GOVERNORATES.find((g) => g.id === govId);
      setGovernorateName(store.governorateName || govObj?.name || 'ذي قار');

      const distId = store.districtId || 'shatrah';
      setDistrictId(distId);
      const distObj = govObj?.districts.find((d) => d.id === distId);
      setDistrictName(store.districtName || distObj?.name || 'الشطرة');

      setDescription(store.description || '');
      setWorkingHours(store.workingHours || '');
      setIsOpenNow(store.isOpen ?? true);

      // Address & Location
      setAddress(store.address || '');
      setGoogleMapsUrl(store.googleMapsUrl || '');
      setLatInput(typeof store.lat === 'number' ? String(store.lat) : '');
      setLngInput(typeof store.lng === 'number' ? String(store.lng) : '');
      setGpsError('');

      // Contact & Social
      setPhone(store.phone || '');
      setWhatsapp(store.whatsapp || '');
      setFacebook(store.facebook || '');
      setInstagram(store.instagram || '');
      setTiktok(store.tiktok || '');
      setTelegram(store.telegram || '');
      setWebsite(store.website || '');

      // Images
      setImageUrl(store.imageUrl || '');
      setGalleryImages(Array.isArray(store.images) ? store.images : store.imageUrl ? [store.imageUrl] : []);

      // Menu
      setMenuItems(Array.isArray(store.menu) ? store.menu : []);
      setMenuImages(Array.isArray(store.menuImages) ? store.menuImages : []);

      setSuccessSaved(false);
      setActiveTab('basic_location');
    }
  }, [store, isOpen]);

  if (!isOpen || !store) return null;

  // Handle Governorate change
  const handleGovernorateChange = (newGovId: string) => {
    setGovernorateId(newGovId);
    const govObj = IRAQ_GOVERNORATES.find((g) => g.id === newGovId);
    if (govObj) {
      setGovernorateName(govObj.name);
      if (govObj.districts.length > 0) {
        setDistrictId(govObj.districts[0].id);
        setDistrictName(govObj.districts[0].name);
      }
    }
  };

  // Handle District change
  const handleDistrictChange = (newDistId: string) => {
    setDistrictId(newDistId);
    const govObj = IRAQ_GOVERNORATES.find((g) => g.id === governorateId);
    const distObj = govObj?.districts.find((d) => d.id === newDistId);
    if (distObj) {
      setDistrictName(distObj.name);
    }
  };

  // Detect current GPS position via browser/device
  const handleDetectCurrentGps = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في متصفحك.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatInput(String(lat));
        setLngInput(String(lng));
      },
      (error) => {
        setIsLocatingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('تم رفض إذن تحديد الموقع. يرجى تفعيل إذن الموقع في إعدادات الهاتف أو المتصفح، أو إدخال الإحداثيات يدوياً.');
        } else {
          setGpsError('تعذر الحصول على إحداثيات دقيقة حالياً. يرجى إدخال الإحداثيات أو رابط خرائط جوجل يدوياً.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Clear GPS coordinates
  const handleClearGps = () => {
    setLatInput('');
    setLngInput('');
    setGpsError('');
  };

  // Cover upload
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const base64 = await compressImageFile(file);
      setImageUrl(base64);
      if (!galleryImages.includes(base64)) {
        setGalleryImages((prev) => [base64, ...prev]);
      }
    } catch (err) {
      console.error('Error uploading cover:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Gallery upload
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        newImages.push(compressed);
      }
      setGalleryImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Error uploading gallery files:', err);
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Menu items management
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || !newMenuPrice.trim()) return;

    const formattedPrice = newMenuPrice.trim().includes('د.ع')
      ? newMenuPrice.trim()
      : `${newMenuPrice.trim()} د.ع`;

    const newItem: StoreMenuItem = {
      id: `menu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newMenuName.trim(),
      price: formattedPrice,
      category: newMenuCategory.trim() || 'أصناف عامة',
      description: newMenuDesc.trim() || undefined,
      popular: isMenuPopular,
    };

    setMenuItems((prev) => [newItem, ...prev]);
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuCategory('');
    setNewMenuDesc('');
    setIsMenuPopular(false);
  };

  const handleRemoveMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Menu photo upload
  const handleMenuPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMenuPhoto(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        newPhotos.push(compressed);
      }
      setMenuImages((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      console.error('Error uploading menu photo:', err);
    } finally {
      setIsUploadingMenuPhoto(false);
      if (menuFileInputRef.current) menuFileInputRef.current.value = '';
    }
  };

  const handleRemoveMenuPhoto = (index: number) => {
    setMenuImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save all modified store information
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('اسم المتجر مطلوب');
      setActiveTab('basic_location');
      return;
    }
    if (!phone.trim()) {
      alert('رقم هاتف المتجر مطلوب');
      setActiveTab('contact_social');
      return;
    }

    // Parse coordinates if provided
    const parsedLat = latInput.trim() ? parseFloat(latInput.trim()) : undefined;
    const parsedLng = lngInput.trim() ? parseFloat(lngInput.trim()) : undefined;

    const validLat = typeof parsedLat === 'number' && !isNaN(parsedLat) ? parsedLat : undefined;
    const validLng = typeof parsedLng === 'number' && !isNaN(parsedLng) ? parsedLng : undefined;

    const finalCover = imageUrl.trim() || store.imageUrl;
    let finalGallery = galleryImages.filter(Boolean);
    if (finalCover && !finalGallery.includes(finalCover)) {
      finalGallery = [finalCover, ...finalGallery];
    }

    const updatedData: Partial<DirectoryItem> = {
      name: name.trim(),
      category,
      subCategory: subCategory.trim(),
      governorateId,
      governorateName,
      districtId,
      districtName,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || `964${phone.trim().replace(/^0/, '')}`,
      address: address.trim(),
      lat: validLat,
      lng: validLng,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      workingHours: workingHours.trim(),
      description: description.trim(),
      imageUrl: finalCover,
      images: finalGallery.length > 0 ? finalGallery : [finalCover],
      isOpen: isOpenNow,
      facebook: facebook.trim() || undefined,
      instagram: instagram.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      telegram: telegram.trim() || undefined,
      website: website.trim() || undefined,
      menu: menuItems,
      menuImages: menuImages,
      lastUpdatedAt: new Date().toISOString(),
    };

    updateStore(store.id, updatedData);
    setSuccessSaved(true);

    const fullUpdatedStore: DirectoryItem = {
      ...store,
      ...updatedData,
    };

    if (onSaved) onSaved(fullUpdatedStore);
    if (onUpdated) onUpdated(fullUpdatedStore);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Broadcast offer handler
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
        ? `قضاء ${districtName || store.districtName || 'منطقتك'}`
        : offerScope === 'governorate'
        ? `عموم محافظة ${governorateName || store.governorateName || 'المحافظة'}`
        : 'كافة محافظات العراق 🇮🇶';

    const fullTitle = `${typePrefix} ${name}`;
    const fullMessage = `${offerTitle.trim()} (${discountPercent || 'عرض خاص'}) - متوفر الآن لدى ${name} (${districtName || store.districtName || 'المنطقة'}، ${governorateName || store.governorateName || 'المحافظة'})!`;

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
      targetGovernorateId: governorateId || store.governorateId,
      targetDistrictId: districtId || store.districtId,
      governorateId: governorateId || store.governorateId,
      governorateName: governorateName || store.governorateName,
      districtId: districtId || store.districtId,
      districtName: districtName || store.districtName,
      categoryId: category || store.category,
      createdAt: new Date().toISOString(),
    });

    setIsBroadcasting(false);
    alert(`تم بنجاح بث الإشعار إلى [${scopeLabel}] وحفظه في سجل إشعارات الدليل! 🎉`);
    setOfferTitle('');
  };

  // Current selected governorate object for district dropdown
  const currentGovObj = IRAQ_GOVERNORATES.find((g) => g.id === governorateId);
  const currentDistricts = currentGovObj?.districts || [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold">
                  تعديل وإدارة كافة معلومات المتجر 👑
                </h3>
                <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  حساب مالك موثق
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {store.name} • يمكنك تحديث كامل التفاصيل، المنيو، الصور والموقع بدقة
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('basic_location')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'basic_location'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-3.5 w-3.5 text-red-600" />
            <span>البيانات والموقع 📍</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact_social')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contact_social'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="h-3.5 w-3.5 text-sky-600" />
            <span>الاتصال والسوشيال 💬</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-emerald-600" />
            <span>الصور والغلاف 📸</span>
            {galleryImages.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 rounded-full">
                {galleryImages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />
            <span>المنيو والأسعار 📋</span>
            {menuItems.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 rounded-full">
                {menuItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>بث العروض 📢</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1">
          {successSaved && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 mb-4 flex items-center gap-2.5 text-emerald-800 font-bold text-xs animate-in fade-in">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span>تم حفظ وتحديث كافة معلومات المتجر بنجاح في الدليل!</span>
            </div>
          )}

          {/* TAB 1: BASIC INFORMATION & ACCURATE LOCATION */}
          {activeTab === 'basic_location' && (
            <div className="space-y-4">
              {/* Store Name & Main Category */}
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
                    placeholder="اسم المتجر أو العيادة أو النشاط"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    القسم والنشاط الرئيسي *
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
                  التخصص الدقيق أو نوع النشاط
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="مثال: مأكولات شرقية ومشويات، أزياء رجالية، صيدلية..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Governorate & District Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    المحافظة 🏛️
                  </label>
                  <select
                    value={governorateId}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-red-500 focus:outline-none"
                  >
                    {IRAQ_GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    القضاء / المنطقة 📍
                  </label>
                  <select
                    value={districtId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-red-500 focus:outline-none"
                  >
                    {currentDistricts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exact Written Address */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  العنوان التفصيلي (الشارع، الحي، أقرب نقطة دالة) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: شارع الكورنيش، قرب جسر الشطرة، مجاور المصرف التجاري"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Accurate Map & GPS Section */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-sky-600" />
                    <span className="font-display text-xs font-bold text-slate-900">
                      تحديد الموقع الدقيق على خرائط Google و GPS
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectCurrentGps}
                    disabled={isLocatingGps}
                    className="flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Compass className="h-3 w-3" />
                    <span>{isLocatingGps ? 'جارِ الجلب...' : 'جلب موقعي الحالي (GPS) 📍'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  يمكنك وضع رابط متجرك في خرائط Google مباشرة، أو تحديد إحداثيات GPS بالضغط على الزر أعلاه وأنت متواجد في محلك ليتمكن الزبائن من التوجه إليك بالملاحة الدقيقة.
                </p>

                {gpsError && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{gpsError}</span>
                  </div>
                )}

                {/* Google Maps URL Link */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    رابط المتجر في خرائط Google (رابط مشاركة الموقع)
                  </label>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... أو https://goo.gl/maps/..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                {/* GPS Coordinates (Lat & Lng) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-700">
                      خط العرض (Latitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      placeholder="مثال: 31.408712"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-700">
                      خط الطول (Longitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lngInput}
                      onChange={(e) => setLngInput(e.target.value)}
                      placeholder="مثال: 46.173845"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {(latInput || lngInput) && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>تم تعيين إحداثيات GPS دقيقة لهذا المتجر</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearGps}
                      className="text-red-600 hover:text-red-700 underline text-[10px] cursor-pointer"
                    >
                      مسح إحداثيات GPS
                    </button>
                  </div>
                )}
              </div>

              {/* Working Hours & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    أوقات وساعات العمل
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="مثال: 9:00 ص - 11:30 م"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    حالة النشاط حالياً
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOpenNow(!isOpenNow)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isOpenNow
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isOpenNow ? '✓ المتجر مفتوح للزبائن حالياً' : '✕ المتجر مغلق مؤقتاً'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  نبذة ووصف المتجر والخدمات المقدمة
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب نبذة ترحيبية بالزبائن توضح أهم الخدمات والمنتجات والعروض..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & SOCIAL MEDIA */}
          {activeTab === 'contact_social' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-200 text-xs text-sky-950 space-y-1">
                <span className="font-bold block">أرقام التواصل والروابط الرسمية:</span>
                <p className="text-[11px] text-sky-800">
                  هذه الأرقام والروابط تتيح للزبائن الاتصال بك ومراسلتك على واتساب ومتابعة صفحاتك الرسمية مباشرة.
                </p>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    رقم الهاتف الرئيسي *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0780xxxxxxx أو 0770xxxxxxx"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:border-red-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    رقم الواتساب للطلبات
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

              {/* Social Media Links */}
              <div className="space-y-3 pt-2">
                <h4 className="font-display text-xs font-bold text-slate-800">
                  حسابات السوشيال ميديا والموقع الإلكتروني:
                </h4>

                {/* Instagram */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-200 shrink-0">
                    📸
                  </div>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="حساب إنستغرام (مثال: @username أو الرابط)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                    📘
                  </div>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="رابط صفحة فيسبوك أو اسم الصفحة"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                    🎵
                  </div>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="حساب تيك توك (مثال: @username)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Telegram */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200 shrink-0">
                    ✈️
                  </div>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="قناة أو معرف تيليجرام (مثال: @username أو الرابط)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Website */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="رابط الموقع الإلكتروني (إن وجد)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS & GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Cover Image Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="block font-display text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span>صورة الغلاف والشعار الرئيسية ⭐</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    تظهر كبطاقة رئيسية للمتجر
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="relative h-24 w-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                    <img
                      src={imageUrl || store.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                      alt="معاينة الغلاف"
                      className="h-full w-full object-cover"
                    />
                    {isUploadingCover && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[10px] text-white font-bold">
                        معالجة...
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileUpload}
                      className="hidden"
                      id="edit-cover-photo-file-input"
                    />
                    <label
                      htmlFor="edit-cover-photo-file-input"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 shadow-2xs cursor-pointer transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>تغيير صورة الغلاف من الهاتف 📱</span>
                    </label>

                    <div>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="أو ألصق رابط صورة الغلاف هنا..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Gallery Photos */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-900">
                      معرض صور المتجر الإضافية ({galleryImages.length})
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      صور المحل من الداخل والخارج، التجهيزات، أو البضاعة
                    </p>
                  </div>

                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFileUpload}
                    className="hidden"
                    id="edit-gallery-photos-file-input"
                  />
                  <label
                    htmlFor="edit-gallery-photos-file-input"
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-3 py-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isUploadingGallery ? 'جارِ الرفع...' : 'إضافة صور +'}</span>
                  </label>
                </div>

                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {galleryImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={img}
                          alt={`صورة ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 left-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          title="حذف الصورة"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <ImageIcon className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                    <span className="text-xs text-slate-500 font-medium block">
                      لا توجد صور إضافية في المعرض حالياً
                    </span>
                    <span className="text-[10px] text-slate-400">
                      اضغط على "إضافة صور +" لرفع صور محلك من هاتفك
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MENU & PRICING */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <UtensilsCrossed className="h-4 w-4 text-amber-700" />
                  <span>إدارة قائمة الأسعار والمنيو الحقيقية للمتجر</span>
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  احرص على إدخال الأصناف والأسعار الحقيقية الخاصة بمتجرك فقط. يمكنك أيضاً تصوير قائمة الأسعار الورقية بهاتفك ورفعها مباشرة.
                </p>
              </div>

              {/* Upload Photographed Menu Gallery */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-amber-700" />
                    <span className="font-display text-xs font-bold text-slate-900">
                      صور المنيو وقوائم الأسعار الورقية ({menuImages.length})
                    </span>
                  </div>

                  <input
                    ref={menuFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMenuPhotoUpload}
                    className="hidden"
                    id="edit-menu-photos-file-input"
                  />
                  <label
                    htmlFor="edit-menu-photos-file-input"
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploadingMenuPhoto ? 'معالجة...' : 'رفع صور المنيو 📷'}</span>
                  </label>
                </div>

                {menuImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {menuImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-amber-200 bg-white"
                      >
                        <img
                          src={img}
                          alt={`منيو ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuPhoto(idx)}
                          className="absolute top-1 left-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          title="حذف الصورة"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Item Form */}
              <form onSubmit={handleAddMenuItem} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3">
                <h4 className="font-display text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  <span>إضافة صنف أو وجبة أو خدمة جديدة للقائمة:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      placeholder="اسم الصنف (مثال: برغر لحم دبل، كشفية طبية...)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      placeholder="السعر (مثال: 7,000 د.ع)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    placeholder="القسم (مثال: وجبات رئيسية، مقبلات، خدمات...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />

                  <input
                    type="text"
                    value={newMenuDesc}
                    onChange={(e) => setNewMenuDesc(e.target.value)}
                    placeholder="وصف مختصر للصنف أو المكونات (اختياري)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMenuPopular}
                      onChange={(e) => setIsMenuPopular(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span className="font-medium">تمييز كصنف أكثر طلباً ⭐</span>
                  </label>

                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة الصنف للقائمة</span>
                  </button>
                </div>
              </form>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>الأصناف المسجلة حالياً ({menuItems.length})</span>
                  {menuItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من رغبتك في حذف جميع أصناف المنيو؟')) {
                          setMenuItems([]);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-[11px] underline cursor-pointer"
                    >
                      حذف كافة الأصناف
                    </button>
                  )}
                </div>

                {menuItems.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.name}</span>
                            {item.category && (
                              <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {item.category}
                              </span>
                            )}
                            {item.popular && (
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                                ⭐ مميز
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-slate-500">{item.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-700">{item.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMenuItem(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">
                      لا توجد أصناف مضافة في القائمة بعد
                    </span>
                    <span className="text-[10px] text-slate-400">
                      استخدم النموذج أعلاه لإضافة منتجاتك وأسعارك الدقيقة
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: OFFERS & NOTIFICATIONS */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-700" />
                  <span>بث إشعار عروض وتخفيضات خاصة لزبائن منطقتك</span>
                </span>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  يمكنك إرسال إشعار فوري لجميع مستخدمي الدليل في قضائك أو محافظتك للإعلان عن خصم جديد أو صنف مميز.
                </p>
              </div>

              <form onSubmit={handlePublishOffer} className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                {/* 1. Update / Offer Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    نوع الإعلان / التحديث
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 text-center">
                    <button
                      type="button"
                      onClick={() => setOfferType('discount')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
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
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        offerType === 'new_item'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🍱 وجبة / صنف جديد
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('service')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        offerType === 'service'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🛠️ خدمة جديدة
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('special_deal')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        offerType === 'special_deal'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⭐ باقة وعرض خاص
                    </button>
                  </div>
                </div>

                {/* 2. Target Scope */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    النطاق الجغرافي المستهدف للإشعار
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => setOfferScope('district')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        offerScope === 'district'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📍 قضاء {districtName || store.districtName || 'المنطقة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferScope('governorate')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        offerScope === 'governorate'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🏛️ عموم {governorateName || store.governorateName || 'المحافظة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferScope('iraq')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        offerScope === 'iraq'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🇮🇶 العراق بأكمله
                    </button>
                  </div>
                </div>

                {/* 3. Title & Badge */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    تفاصيل العرض أو التحديث *
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
                    className="mt-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50 transition-all"
                  >
                    {isBroadcasting ? 'جارِ البث...' : 'بث الإشعار للزبائن 📢'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Footer */}
        <div className="border-t border-slate-200 p-3.5 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-display text-xs sm:text-sm font-bold px-6 py-2.5 shadow-md transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>حفظ كافة تعديلات المتجر في الدليل ✅</span>
          </button>
        </div>
      </div>
    </div>
  );
};
