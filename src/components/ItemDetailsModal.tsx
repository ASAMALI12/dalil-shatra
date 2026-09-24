import React, { useState, useRef } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Share2,
  Trash2,
  ShieldAlert,
  Crown,
  ShieldCheck,
  Edit3,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Globe,
  Send,
  Megaphone,
  LogOut,
  Check,
  Settings,
  ExternalLink,
  Camera,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  UtensilsCrossed,
  FileText,
} from 'lucide-react';
import { DirectoryItem, StoreMenuItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useWallet } from '../context/WalletContext';
import { StoreShareModal } from './StoreShareModal';
import { StoreLocationMap } from './StoreLocationMap';
import { StoreMenuSection } from './StoreMenuSection';
import { StoreReviewsSection } from './StoreReviewsSection';
import { EditStoreMenuModal } from './EditStoreMenuModal';
import {
  formatTikTokUrl,
  formatTelegramUrl,
  formatWebsiteUrl,
  openExternalUrl,
  openSocialMediaLink,
} from '../utils/socialLinks';

interface ItemDetailsModalProps {
  item: DirectoryItem | null;
  onClose: () => void;
  onClaimStore?: (store: DirectoryItem) => void;
  onEditStore?: (store: DirectoryItem) => void;
  onReportStore?: (store: DirectoryItem) => void;
}

// Compress image file to efficient base64 data URL for instant storage
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

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onClaimStore,
  onEditStore,
  onReportStore,
}) => {
  const { deleteStore, isUserStoreOwner, updateStore, unclaimStore, items } = useDirectory();
  const { isManagerUnlocked } = useWallet();

  // Always use the latest live store data from directory state
  const currentStore = (items && items.find((i) => i.id === item?.id)) || item;

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showManagerDeleteConfirm, setShowManagerDeleteConfirm] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Menu & Location interactive states
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Gallery & Image Management states (Restricted strictly to Store Owner)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showImageManager, setShowImageManager] = useState(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!item) return null;

  // General manager has full owner permissions across all stores in the application
  const isOwner = isUserStoreOwner(currentStore.id) || isManagerUnlocked;
  const canManagePhotos = isOwner;

  const handleSaveMenu = (newMenu: StoreMenuItem[], newMenuImages: string[]) => {
    updateStore(currentStore.id, { menu: newMenu, menuImages: newMenuImages });
    setStatusMessage('تم حفظ وتحديث المنيو وقائمة الأسعار بنجاح ✅');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Build the list of images for this store
  const currentImages: string[] = Array.isArray(currentStore.images) && currentStore.images.length > 0
    ? currentStore.images
    : (currentStore.imageUrl ? [currentStore.imageUrl] : []);

  const handleToggleOpenStatus = () => {
    const newStatus = !currentStore.isOpen;
    updateStore(currentStore.id, { isOpen: newStatus });
    setStatusMessage(
      newStatus
        ? 'تم فتح المتجر بنجاح لاستقبال طلبات الزبائن 🟢'
        : 'تم تحويل حالة المتجر إلى مغلق مؤقتاً 🔴'
    );
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleLogoutOwner = () => {
    unclaimStore(item.id);
    setShowLogoutConfirm(false);
    setStatusMessage('تم تسجيل الخروج وإلغاء ارتباط المتجر بجهازك');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Upload local images from phone or desktop
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const newBase64Images: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file);
          newBase64Images.push(compressed);
        }
      }

      if (newBase64Images.length > 0) {
        const updatedList = [...currentImages, ...newBase64Images];
        const primaryImg = updatedList[0] || item.imageUrl;
        await updateStore(item.id, {
          images: updatedList,
          imageUrl: primaryImg,
        });

        setStatusMessage(`تمت إضافة ${newBase64Images.length} صورة للمتجر وحفظها بنجاح 📸`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error processing image upload:', err);
      setStatusMessage('حدث خطأ أثناء معالجة الصور، يرجى المحاولة مرة أخرى');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add image by URL
  const handleAddImageUrl = async () => {
    if (!newImageUrlInput.trim()) return;
    const url = newImageUrlInput.trim();

    const updatedList = [...currentImages, url];
    await updateStore(item.id, {
      images: updatedList,
      imageUrl: item.imageUrl || url,
    });

    setNewImageUrlInput('');
    setStatusMessage('تمت إضافة الصورة إلى معرض المتجر بنجاح 📸');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Remove an image from gallery
  const handleRemoveImage = async (indexToRemove: number) => {
    const updatedList = currentImages.filter((_, idx) => idx !== indexToRemove);
    const newCover = updatedList[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
    await updateStore(item.id, {
      images: updatedList,
      imageUrl: newCover,
    });
    setStatusMessage('تم حذف الصورة من المعرض بنجاح');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Set an image as the primary cover photo
  const handleSetPrimaryImage = async (imgUrl: string) => {
    // Reorder so that this image is first
    const rest = currentImages.filter((img) => img !== imgUrl);
    const updatedList = [imgUrl, ...rest];
    await updateStore(item.id, {
      imageUrl: imgUrl,
      images: updatedList,
    });
    setStatusMessage('تم تعيين الصورة كغلاف رئيسي للمتجر ⭐');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            TOP HEADER BAR (شريط العنوان العلوي وأزرار التحكم)
            ========================================================================= */}
        <div className="border-b border-slate-200/90 bg-white px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
              <span>رجوع</span>
            </button>
            <span className="font-display text-xs font-black text-slate-800">
              الملف التعريفي للمتجر
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && (
              <span className="rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-900 flex items-center gap-1 shadow-2xs">
                <Crown className="h-3 w-3 text-emerald-600" />
                <span>مالك المتجر 👑</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="مشاركة المتجر"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            SCROLLABLE STORE PROFILE PAGE CONTENT
            ========================================================================= */}
        <div className="overflow-y-auto p-3.5 sm:p-4 space-y-4 text-slate-800 flex-1">
          {/* Status Message Notification Toast */}
          {statusMessage && (
            <div className="rounded-2xl bg-emerald-600 text-white p-2.5 text-xs font-bold text-center shadow-md animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {/* =========================================================================
              MANAGER SUPERADMIN CONTROLS (صلاحيات المدير العام للمتجر)
              ========================================================================= */}
          {isManagerUnlocked && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border-2 border-amber-500/60 p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-xs">
                    👑
                  </span>
                  <div>
                    <span className="font-display text-xs font-black text-amber-950 block">
                      صلاحيات المدير العام مفعّلة بالكامل لهذا المتجر 🇮🇶
                    </span>
                    <span className="text-[10px] text-amber-900 font-medium">
                      يمكنك تعديل أي بيانات، إدارة الصور والمنيو، تغيير حالة الفتح، أو حذف المتجر
                    </span>
                  </div>
                </div>
                <span className="rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5">
                  تحكم إداري مباشر
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {onEditStore && (
                  <button
                    type="button"
                    onClick={() => onEditStore(currentStore)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-amber-400/80 py-2 px-2 text-xs font-bold text-slate-900 hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                    <span>تعديل المتجر</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMenuEditor(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-amber-400/80 py-2 px-2 text-xs font-bold text-slate-900 hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />
                  <span>المنيو والأسعار</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImageManager(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-amber-400/80 py-2 px-2 text-xs font-bold text-slate-900 hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5 text-amber-600" />
                  <span>إدارة الصور</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleOpenStatus}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold text-white cursor-pointer shadow-2xs transition-all active:scale-95 ${
                    currentStore.isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <span>{currentStore.isOpen ? 'تحويل لمغلق' : 'تحويل لمفتوح'}</span>
                </button>
              </div>

              {/* Verification & Instant Delete by Manager */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-400/30">
                <div className="flex items-center gap-2">
                  {currentStore.isClaimed || currentStore.claimStatus === 'verified' ? (
                    <button
                      type="button"
                      onClick={() => {
                        unclaimStore(currentStore.id);
                        setStatusMessage('تم إلغاء توثيق هذا المتجر وإعادته كمتجر غير مطالب به');
                        setTimeout(() => setStatusMessage(null), 3000);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 cursor-pointer transition-colors"
                    >
                      <span>إلغاء التوثيق</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        updateStore(currentStore.id, { isClaimed: true, claimStatus: 'verified', claimedAt: new Date().toISOString() });
                        setStatusMessage('تم توثيق المتجر فورياً بصفة رسمية من قبل المدير العام 🛡️');
                        setTimeout(() => setStatusMessage(null), 3000);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>توثيق ملكية المتجر فوراً كمدير</span>
                    </button>
                  )}
                </div>

                <div>
                  {showManagerDeleteConfirm ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          deleteStore(currentStore.id);
                          onClose();
                        }}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                      >
                        تأكيد حذف المتجر نهائياً
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManagerDeleteConfirm(false)}
                        className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 text-[11px] font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowManagerDeleteConfirm(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg px-2 py-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف المتجر كمدير</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STORE HERO COVER BANNER & SHOWCASE
              ========================================================================= */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm group">
            {/* Store Cover Image */}
            <div
              className="relative h-44 sm:h-52 w-full cursor-pointer overflow-hidden"
              onClick={() => {
                if (currentImages.length > 0) setLightboxIndex(0);
              }}
            >
              <img
                src={item.imageUrl || (currentImages[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80')}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              {/* Floating Badges */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black text-white shadow-xs backdrop-blur-md ${
                  item.isOpen ? 'bg-emerald-600/90' : 'bg-rose-600/90'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.isOpen ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}`} />
                  {item.isOpen ? 'مفتوح الآن' : 'مغلق مؤقتاً'}
                </span>

                {item.isClaimed && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/90 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-black shadow-xs">
                    <Crown className="h-3 w-3" />
                    موثق لمالكه
                  </span>
                )}
              </div>

              {/* Photo Count Pill */}
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-black shadow-xs border border-white/20">
                  <ImageIcon className="h-3 w-3" />
                  <span>{currentImages.length} صور</span>
                </span>
              </div>

              {/* Store Title & Meta on Cover */}
              <div className="absolute bottom-3 right-3 left-3 text-white space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="rounded-lg bg-sky-600/90 backdrop-blur-md text-white px-2 py-0.5 text-[10px] font-extrabold">
                    {item.subCategory || item.category || 'متجر معتمد'}
                  </span>
                  {item.rating && (item.reviewsCount || 0) > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black shadow-2xs">
                      <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
                      <span>{item.rating.toFixed(1)}</span>
                      <span className="opacity-75 font-normal text-[9px]">({item.reviewsCount})</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-200 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                      <span>جديد</span>
                      <span className="opacity-75 text-[9px]">(بدون تقييم)</span>
                    </div>
                  )}
                </div>

                <h2 className="font-display text-lg sm:text-xl font-black text-white drop-shadow-sm">
                  {item.name}
                </h2>

                <div className="flex items-center gap-1 text-[11px] text-slate-200">
                  <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                  <span className="truncate">{item.governorateName || 'العراق'} {item.districtName ? `• ${item.districtName}` : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              DIRECT ACTION BUTTONS (اتصال هاتفي + واتساب + الموقع + مشاركة)
              ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Phone Call */}
            <a
              href={`tel:${item.phone}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white py-2.5 px-3 text-xs font-black shadow-sm transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>اتصال هاتفي</span>
            </a>

            {/* WhatsApp */}
            {item.whatsapp && (
              <a
                href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openSocialMediaLink('whatsapp', item.whatsapp!, item.name, e)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2.5 px-3 text-xs font-black shadow-sm transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>واتساب المتجر</span>
              </a>
            )}

            {/* Share */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white py-2.5 px-3 text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>مشاركة الصفحة</span>
            </button>
          </div>

          {/* =========================================================================
              PHOTO GALLERY SECTION (معرض صور المتجر + إدارة وإضافة الصور لصاحب التطبيق)
              ========================================================================= */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                    معرض صور المتجر ومنتجاته
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    يحتوي على ({currentImages.length}) صور
                  </span>
                </div>
              </div>

              {/* Photo Management Button strictly for Store Owner */}
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowImageManager(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 text-xs font-black shadow-xs transition-all cursor-pointer"
                  title="إضافة صور للمتجر أو تعيين الغلاف"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>إدارة الصور والغلاف 📸</span>
                </button>
              ) : !item.isClaimed && onClaimStore ? (
                <button
                  type="button"
                  onClick={() => onClaimStore(item)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1 text-[11px] font-black shadow-xs transition-all cursor-pointer"
                  title="هل أنت صاحب هذا المتجر؟ وثقه للتحكم بالصور والبيانات"
                >
                  <Crown className="h-3 w-3 text-amber-600" />
                  <span>وثّق متجرك للتحكم بالصور 🔑</span>
                </button>
              ) : null}
            </div>

            {/* Gallery Grid */}
            {currentImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {currentImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                  >
                    <img
                      src={imgUrl}
                      alt={`${item.name} - صورة ${index + 1}`}
                      className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-1 right-1 rounded-md bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.2 shadow-xs">
                        الغلاف
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded-md">
                        عرض
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 space-y-1">
                <ImageIcon className="h-7 w-7 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">لا توجد صور إضافية لهذا المتجر بعد</p>
                <p className="text-[10px] text-slate-400">
                  {isOwner
                    ? 'يمكنك إضافة صور جديدة لمتجرك وتعيين الغلاف مباشرة من الزر أعلاه'
                    : 'يمكن لصاحب المتجر الموثق إضافة صور المتجر وتعيين الغلاف'}
                </p>
              </div>
            )}
          </div>

          {/* =========================================================================
              STORE PROFILE BIO & DETAILS (الملف التعريفي، نبذة، ساعات العمل، والعنوان)
              ========================================================================= */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <h3 className="font-display text-xs sm:text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              الملف التعريفي للمتجر والمعلومات
            </h3>

            {/* Description / Bio */}
            {item.description && item.description.trim().length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-red-500" />
                    النبذة التعريفية للمتجر والخدمات:
                  </span>
                  {isOwner && onEditStore && (
                    <button
                      onClick={() => onEditStore(item)}
                      className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      تعديل النبذة ✏️
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {item.description}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-right">
                    <h4 className="text-xs font-bold text-slate-900">
                      لم يتم كتابة النبذة التعريفية بعد
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      يُترك لصاحب المتجر عند توثيق متجره كتابة نوع الأكلات، أنواع الألبسة، اختصاصات العيادة، وتفاصيل السلع والخدمات بدقة.
                    </p>
                  </div>
                </div>

                {isOwner && onEditStore ? (
                  <button
                    onClick={() => onEditStore(item)}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>اكتب نبذة عن متجرك، نوع الأكلات، الألبسة، أو الخدمات الآن ✍️</span>
                  </button>
                ) : !item.isClaimed && onClaimStore ? (
                  <button
                    onClick={() => onClaimStore(item)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>هل أنت صاحب المتجر؟ وثّق متجرك لكتابة النبذة وقائمة الأصناف 👑</span>
                  </button>
                ) : null}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Working Hours */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">أوقات وساعات العمل:</span>
                  <span className="text-slate-600">{item.workingHours || 'غير محددة'}</span>
                </div>
              </div>

              {/* Exact Address */}
              <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">العنوان الدقيق:</span>
                    {item.address && item.address.trim().length > 0 ? (
                      <span className="text-slate-800 font-semibold">{item.address}</span>
                    ) : (
                      <span className="text-amber-800 text-[11px] font-medium block">
                        لم يُحدد بعد (يُترك للمالك الموثق)
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && onEditStore ? (
                  <button
                    type="button"
                    onClick={() => onEditStore(item)}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 shrink-0 cursor-pointer pt-0.5"
                  >
                    {item.address ? 'تعديل ✏️' : 'إضافة عنوان ✏️'}
                  </button>
                ) : !item.isClaimed && onClaimStore ? (
                  <button
                    type="button"
                    onClick={() => onClaimStore(item)}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 shrink-0 cursor-pointer pt-0.5"
                  >
                    وثّق وأضف 👑
                  </button>
                ) : null}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <Phone className="h-4 w-4 text-sky-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">رقم هاتف المتجر:</span>
                  <span className="text-slate-600 font-mono text-xs">{item.phone}</span>
                </div>
              </div>

              {/* WhatsApp */}
              {item.whatsapp && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                  <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">رقم الواتساب:</span>
                    <span className="text-slate-600 font-mono text-xs">{item.whatsapp}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Social Links if TikTok, Telegram or Website exist (Instagram & Facebook completely removed) */}
          {(item.tiktok || item.telegram || item.website) && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-2">
              <h4 className="font-display text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>وسائل تواصل ومواقع إضافية</span>
                <span className="text-sm">🌐</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.tiktok && (() => {
                  const ttUrl = formatTikTokUrl(item.tiktok);
                  return (
                    <a
                      href={ttUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => openSocialMediaLink('tiktok', item.tiktok!, item.name, e)}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-slate-800 transition-all"
                    >
                      <span>🎵</span>
                      <span>تيك توك</span>
                    </a>
                  );
                })()}

                {item.telegram && (() => {
                  const tgUrl = formatTelegramUrl(item.telegram);
                  return (
                    <a
                      href={tgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => openSocialMediaLink('telegram', item.telegram!, item.name, e)}
                      className="flex items-center gap-1.5 rounded-xl bg-sky-500 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-sky-600 transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>تيليجرام</span>
                    </a>
                  );
                })()}

                {item.website && (() => {
                  const siteUrl = formatWebsiteUrl(item.website);
                  return (
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => openSocialMediaLink('website', item.website!, item.name, e)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-emerald-800 transition-all"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>الموقع الإلكتروني</span>
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

          {/* =========================================================================
              STORE MENU & PRICE LIST (منيو وقائمة الأسعار للمتجر)
              ========================================================================= */}
          <StoreMenuSection
            item={currentStore}
            isOwner={isOwner}
            onOpenMenuEditor={() => setShowMenuEditor(true)}
            onOpenImageZoom={(url) => setZoomImageUrl(url)}
            onClaimStore={onClaimStore}
          />

          {/* =========================================================================
              STORE GEOGRAPHIC LOCATION & MAP (موقع وخريطة المتجر والاتجاهات)
              ========================================================================= */}
          <StoreLocationMap
            item={currentStore}
            isOwner={isOwner}
            onOpenEditLocation={() => onEditStore?.(currentStore)}
            onClaimStore={onClaimStore}
          />

          {/* =========================================================================
              STORE REVIEWS & 5-STAR RATINGS (التقييمات الحقيقية 5 نجوم)
              ========================================================================= */}
          <StoreReviewsSection item={currentStore} />

          {/* =========================================================================
              STORE OWNER CONTROLS (إدارة وتعديل المتجر لمالكه الموثق)
              ========================================================================= */}
          {isOwner && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-emerald-700" />
                  <div>
                    <span className="font-display text-xs font-black text-emerald-950 block">
                      أنت المالك الموثق لهذا المتجر 👑
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      يمكنك تعديل بيانات المتجر بالكامل وإضافة الصور والمنيو والأسعار
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleOpenStatus}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-2xs cursor-pointer transition-colors ${
                    item.isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {item.isOpen ? 'تحويل لمغلق' : 'فتح المتجر الآن'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {onEditStore && (
                  <button
                    type="button"
                    onClick={() => onEditStore(item)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-emerald-300 py-2.5 px-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="h-4 w-4 text-emerald-700" />
                    <span>تعديل المعلومات ✏️</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMenuEditor(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>المنيو والأسعار 📋</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageManager(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Camera className="h-4 w-4" />
                  <span>صور المتجر 📸</span>
                </button>
              </div>
            </div>
          )}

          {/* Report Store */}
          {onReportStore && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => onReportStore(item)}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <span>إبلاغ عن بيانات خاطئة أو غير صحيحة</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="shrink-0 sticky bottom-0 z-20 border-t border-slate-200/90 py-2 px-3 sm:px-4 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>العودة للمتاجر</span>
            </button>
            <a
              href={`tel:${item.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2 px-3 text-xs font-black shadow-xs transition-all text-center"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>اتصال ({item.phone})</span>
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FULLSCREEN IMAGE LIGHTBOX VIEWER
          ========================================================================= */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Header */}
          <div
            className="w-full flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-white">
                {item.name}
              </span>
              <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                {lightboxIndex + 1} من {currentImages.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox Main Image & Navigation */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImages[lightboxIndex]}
              alt={`${item.name} - ${lightboxIndex + 1}`}
              className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {/* Previous Button */}
            {currentImages.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : currentImages.length - 1))}
                className="absolute right-2 sm:right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Next Button */}
            {currentImages.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev !== null && prev < currentImages.length - 1 ? prev + 1 : 0))}
                className="absolute left-2 sm:left-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Thumbnails Strip */}
          {currentImages.length > 1 && (
            <div
              className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-2 bg-white/10 rounded-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-12 w-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    lightboxIndex === idx ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PHOTO MANAGEMENT MODAL (إدارة وإضافة الصور لصاحب التطبيق)
          ========================================================================= */}
      {showImageManager && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowImageManager(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-black text-slate-900">
                    إدارة وتحديث صور المتجر والغلاف 📸
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    أضف أو احذف صور متجرك وعيّن صورة الغلاف الرئيسية بكل سهولة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageManager(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto space-y-3.5 flex-1 pr-1">
              {/* 1. Upload Local Images from Phone / Computer */}
              <div className="rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/60 p-4 text-center space-y-2">
                <Upload className="h-7 w-7 text-sky-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-sky-950">
                    رفع صور من الهاتف أو الحاسوب مباشرة 📱
                  </p>
                  <p className="text-[10px] text-slate-500">
                    يمكنك تحديد عدة صور معاً من ألبوم الهاتف لإضافتها فورياً
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="store-photos-upload-input"
                />

                <label
                  htmlFor="store-photos-upload-input"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs px-4 py-2 shadow-xs cursor-pointer active:scale-95 transition-all ${
                    isUploadingImages ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{isUploadingImages ? 'جاري ضغط ومعالجة الصور...' : 'اختيار صور من الهاتف'}</span>
                </label>
              </div>

              {/* 2. Add Image via Web URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  أو إضافة رابط صورة خارجي (URL):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={newImageUrlInput}
                    onChange={(e) => setNewImageUrlInput(e.target.value)}
                    placeholder="https://... رابط الصورة"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* 3. List Current Photos with Delete & Set Cover Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    الصور الحالية للمتجر ({currentImages.length}):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    اضغط ⭐ لتعيين الصورة كغلاف
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`صورة ${idx + 1}`}
                        className="h-24 w-full object-cover"
                      />

                      {/* Cover Badge */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          الغلاف الرئيسي ⭐
                        </span>
                      )}

                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(imgUrl)}
                            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                            title="تعيين كصورة رئيسية"
                          >
                            ⭐ غلاف
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                          title="حذف الصورة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowImageManager(false)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 text-white py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Share Modal */}
      {isShareModalOpen && (
        <StoreShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          item={item}
        />
      )}

      {/* Edit Store Menu Modal */}
      {showMenuEditor && (
        <EditStoreMenuModal
          isOpen={showMenuEditor}
          onClose={() => setShowMenuEditor(false)}
          item={item}
          onSave={handleSaveMenu}
        />
      )}

      {/* Menu Image Zoom Lightbox */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in"
          onClick={() => setZoomImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImageUrl(null)}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={zoomImageUrl}
            alt={`صورة منيو ${item.name}`}
            className="max-h-[88vh] max-w-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
