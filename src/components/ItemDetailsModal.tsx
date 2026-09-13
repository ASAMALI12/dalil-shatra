import React, { useState } from 'react';
import {
  X,
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
  Instagram,
  Facebook,
  Globe,
  Send,
  Megaphone,
  LogOut,
  Check,
  Settings,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useWallet } from '../context/WalletContext';
import { VerifiedStoreAdModal } from './VerifiedStoreAdModal';
import { StoreCategoryAnimatedAdBanner } from './StoreCategoryAnimatedAdBanner';
import { normalizeCategoryId, getCategoryDisplayInfo } from '../utils/categoryMatcher';

interface ItemDetailsModalProps {
  item: DirectoryItem | null;
  onClose: () => void;
  onClaimStore?: (store: DirectoryItem) => void;
  onEditStore?: (store: DirectoryItem) => void;
  onReportStore?: (store: DirectoryItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onClaimStore,
  onEditStore,
  onReportStore,
}) => {
  const { deleteStore, isUserStoreOwner, updateStore, unclaimStore } = useDirectory();
  const { isManagerUnlocked } = useWallet();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Store Owner Account & Management states
  const [isAdBookingOpen, setIsAdBookingOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!item) return null;

  const isOwner = isUserStoreOwner(item.id);

  const handleToggleOpenStatus = () => {
    const newStatus = !item.isOpen;
    updateStore(item.id, { isOpen: newStatus });
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

  const handleShare = async () => {
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    const shareUrl = `${currentOrigin}${currentPath}?storeId=${encodeURIComponent(item.id)}`;
    const locationInfo = item.governorateName ? `${item.governorateName} - ${item.districtName || ''}` : (item.districtName || 'العراق');
    
    const shareData = {
      title: `${item.name} | دليل العراق`,
      text: `📍 ${item.name} (${item.subCategory || item.category})\nالموقع: ${locationInfo}\nهاتف: ${item.phone}\nتصفح بيانات المتجر في دليل العراق:`,
      url: shareUrl,
    };

    // 1. Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setStatusMessage('تمت المشاركة بنجاح! 🚀');
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      } catch (err: any) {
        // User cancelled share dialog or it aborted
        if (err && err.name === 'AbortError') {
          return;
        }
      }
    }

    // 2. Clipboard fallback (if Web Share API not available or failed)
    try {
      const copyText = `${shareData.title}\n${shareData.text}\n${shareUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = copyText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setStatusMessage('تم نسخ رابط وتفاصيل المتجر بنجاح لمشاركتها 📋');
      setTimeout(() => {
        setIsCopied(false);
        setStatusMessage(null);
      }, 3500);
    } catch (err) {
      setIsCopied(true);
      setStatusMessage('تم نسخ الرابط!');
      setTimeout(() => {
        setIsCopied(false);
        setStatusMessage(null);
      }, 3000);
    }
  };

  const handleDelete = () => {
    deleteStore(item.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg sm:max-w-xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-4 py-2.5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 text-xs font-black transition-all cursor-pointer active:scale-95 border border-slate-200"
          >
            <ArrowRight className="h-4 w-4" />
            <span>رجوع للخلف</span>
          </button>

          <div className="truncate px-2 text-center">
            <h3 className="font-display text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
              {item.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="مشاركة"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compact Store Header with Small Image (صورة صغيرة وموجزة دون أخذ الشاشة) */}
        <div className="border-b border-slate-200/90 bg-slate-50/80 p-3 sm:p-3.5 flex items-center gap-3 shrink-0">
          {/* Small Store Image Thumbnail */}
          <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
            <img
              src={item.imageUrl}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            {item.isClaimed && (
              <span className="absolute top-1 right-1 rounded-md bg-amber-400 text-slate-950 p-0.5 text-[9px] shadow-xs" title="موثق لمالكه">
                <Crown className="h-3 w-3" />
              </span>
            )}
          </div>

          {/* Store Info Beside the Small Image */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-block rounded-lg bg-sky-100 border border-sky-200 text-sky-900 px-2 py-0.5 text-[11px] font-extrabold">
                {item.subCategory || item.districtName || 'دليل العراق'}
              </span>
              {item.isClaimed && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-black">
                  <Crown className="h-3 w-3 text-amber-600" />
                  موثق لمالكه
                </span>
              )}
              <div className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[11px] font-black text-white shadow-2xs">
                <Star className="h-3 w-3 fill-white text-white" />
                <span>{item.rating}</span>
              </div>
            </div>

            <h3 className="font-display text-base sm:text-lg font-black text-slate-900 truncate">
              {item.name}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1 font-bold text-slate-700 truncate">
                <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span className="truncate">{item.governorateName || ''} {item.districtName ? `• ${item.districtName}` : ''}</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${item.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${item.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {item.isOpen ? 'مفتوح الآن' : 'مغلق'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content - Everything inside the store is readily visible */}
        <div className="overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-slate-800 flex-1">
          {/* المربع الإعلاني لصفحة المتجر بسعر 10 آلاف دينار للشهر مع انيميشن ملكي جذاب */}
          <StoreCategoryAnimatedAdBanner
            categoryTitle={item.name}
            onOpenClaimStoreModal={onClaimStore}
          />

          {/* =========================================================================
              STORE OWNER ACCOUNT & MANAGEMENT (حساب صاحب المتجر داخل صفحته)
              ========================================================================= */}
          <div className="rounded-3xl border-2 border-emerald-200/90 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/50 p-4 sm:p-5 shadow-xs space-y-3.5">
            {/* Status Alert if toggled */}
            {statusMessage && (
              <div className="rounded-2xl bg-emerald-600 text-white p-2.5 text-xs font-bold text-center shadow-xs animate-in fade-in">
                {statusMessage}
              </div>
            )}

            {isOwner ? (
              /* Case A: User is the Verified Owner of this Store */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-xs">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display text-sm font-black text-slate-900">
                          حساب صاحب المتجر 👑
                        </h4>
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          حساب موثق ✅
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        مرحباً بك {item.claimedByName ? `(${item.claimedByName})` : ''} • تحكّم بمتجرك وحجوزاتك
                      </p>
                    </div>
                  </div>

                  {/* Logout from store management */}
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                    title="تسجيل الخروج من إدارة المتجر"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>خروج</span>
                  </button>
                </div>

                {/* Logout confirmation alert */}
                {showLogoutConfirm && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 space-y-2 text-rose-900">
                    <p className="text-xs font-bold">
                      هل تريد تسجيل الخروج من إدارة هذا المتجر على هذا الجهاز؟
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLogoutOwner}
                        className="rounded-xl bg-rose-600 text-white px-3 py-1 text-xs font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        تأكيد الخروج
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="rounded-xl bg-slate-200 text-slate-700 px-3 py-1 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Owner Store Control Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* 1. Toggle Open/Close Status */}
                  <button
                    type="button"
                    onClick={handleToggleOpenStatus}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-98 cursor-pointer shadow-2xs ${
                      item.isOpen
                        ? 'bg-emerald-500/10 border-emerald-300 hover:bg-emerald-500/15 text-emerald-950'
                        : 'bg-rose-500/10 border-rose-300 hover:bg-rose-500/15 text-rose-950'
                    }`}
                  >
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold">حالة استقبال الزبائن</div>
                      <div className="font-display text-xs font-extrabold flex items-center gap-1.5 mt-0.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{item.isOpen ? 'مفتوح الآن للزبائن' : 'مغلق مؤقتاً حالياً'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] rounded-xl bg-white/90 border border-slate-200/80 px-2 py-1 font-bold text-slate-700 shadow-2xs">
                      تبديل ⚡
                    </span>
                  </button>

                  {/* 2. Edit Store Details */}
                  {onEditStore && (
                    <button
                      type="button"
                      onClick={() => onEditStore(item)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-900 transition-all active:scale-98 cursor-pointer shadow-2xs group"
                    >
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold">تحديث البيانات</div>
                        <div className="font-display text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors mt-0.5">
                          تعديل معلومات المتجر
                        </div>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Edit3 className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  )}
                </div>

                {/* 3. Book Category VIP Ad for this store */}
                <button
                  type="button"
                  onClick={() => setIsAdBookingOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/20 transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xs font-black">
                        حجز إعلان لمتجري في صدارة القسم 📢
                      </div>
                      <div className="text-[10px] text-amber-100">
                        10,000 د.ع / شهر • يظهر إعلان متجرك في صدارة قسم {item.districtName || 'المنطقة'}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-xl bg-white text-amber-900 font-black text-[11px] px-2.5 py-1 shadow-xs">
                    حجز الآن
                  </span>
                </button>
              </div>
            ) : (
              /* Case B: Store Not Claimed Yet - Login to Owner Account */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-xs">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs sm:text-sm font-black text-slate-900">
                        توثيق ملكية هذا المتجر 👑
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        وثّق ملكية متجرك عبر رمز OTP المرسل إلى واتساب المتجر لإدارته وبث العروض
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  {onClaimStore ? (
                    <button
                      type="button"
                      onClick={() => onClaimStore(item)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-red-600 hover:from-amber-700 hover:to-red-700 text-white py-3 px-4 text-xs sm:text-sm font-bold shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <Crown className="h-4 w-4 text-amber-200" />
                      <span>توثيق ملكية المتجر عبر رمز الواتساب (OTP) 👑</span>
                    </button>
                  ) : (
                    <div className="text-center py-2 text-xs font-semibold text-slate-500">
                      لإدارة المتجر، يرجى توثيق الملكية عبر التحقق من رقم الهاتف.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status & Work Hours */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">أوقات العمل:</span>
              <span className="text-xs font-bold text-slate-900">{item.workingHours}</span>
            </div>

            {item.isOpen ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                مفتوح الآن
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                مغلق حالياً
              </span>
            )}
          </div>

          {/* Address & Governorate */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {item.governorateName && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                    📍 {item.governorateName} {item.districtName ? `• ${item.districtName}` : ''}
                  </span>
                )}
              </div>
              <span className="font-bold text-slate-800">العنوان: </span>
              <span>{item.address}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="font-display text-xs font-bold text-slate-700 uppercase">
              حول المكان والخدمات
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
              {item.description}
            </p>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Media Links Section */}
          {(item.instagram || item.facebook || item.tiktok || item.telegram || item.website) && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-2.5">
              <h4 className="font-display text-xs font-bold text-slate-700">
                صفحات وحسابات التواصل الاجتماعي 🌐
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.instagram && (
                  <a
                    href={item.instagram.startsWith('http') ? item.instagram : `https://instagram.com/${item.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:opacity-90 transition-opacity"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    <span>إنستغرام ({item.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')})</span>
                  </a>
                )}

                {item.facebook && (
                  <a
                    href={item.facebook.startsWith('http') ? item.facebook : `https://facebook.com/${item.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    <span>فيسبوك</span>
                  </a>
                )}

                {item.tiktok && (
                  <a
                    href={item.tiktok.startsWith('http') ? item.tiktok : `https://tiktok.com/@${item.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs">🎵</span>
                    <span>تيك توك</span>
                  </a>
                )}

                {item.telegram && (
                  <a
                    href={item.telegram.startsWith('http') ? item.telegram : `https://t.me/${item.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-sky-500 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-sky-600 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>تيليجرام</span>
                  </a>
                )}

                {item.website && (
                  <a
                    href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-emerald-800 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>الموقع الإلكتروني</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Admin Delete Action for Unlocked Manager */}
          {isManagerUnlocked && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  صلاحية مدير النظام:
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف المتجر من الدليل</span>
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in">
                  <p className="text-xs font-bold text-slate-800">
                    هل أنت متأكد من حذف ({item.name}) نهائياً من قاعدة بيانات دليل العراق؟
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 shadow-sm cursor-pointer"
                    >
                      تأكيد الحذف النهائي
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-lg bg-slate-100 text-slate-600 text-xs px-3 py-1.5 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Report Store Button */}
          {onReportStore && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => onReportStore(item)}
                className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <span>إبلاغ عن بيانات خاطئة أو غير صحيحة</span>
              </button>
            </div>
          )}

          {/* Return to previous list button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-3 text-xs font-black transition-all cursor-pointer active:scale-98 border border-slate-200"
            >
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <span>العودة للقائمة السابقة</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Footer (Shortened, Balanced Grid, never overflows) */}
        <div className="shrink-0 sticky bottom-0 z-20 border-t border-slate-200/90 py-2 px-2.5 sm:px-4 bg-white/95 backdrop-blur-md shadow-xs">
          <div className={`grid ${item.whatsapp ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2 w-full`}>
            {/* Direct Phone Call */}
            <a
              href={`tel:${item.phone}`}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 py-1.5 px-1 sm:px-2 font-display text-xs font-bold text-white shadow-xs active:scale-95 transition-all text-center h-9 sm:h-9.5 min-w-0"
              title={`اتصال هاتفي: ${item.phone}`}
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">اتصال</span>
              <span className="hidden md:inline truncate text-[11px] font-normal">({item.phone})</span>
            </a>

            {/* WhatsApp Chat */}
            {item.whatsapp && (
              <a
                href={`https://wa.me/${item.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-1 sm:px-2 py-1.5 font-display text-xs font-bold text-white shadow-xs active:scale-95 transition-all text-center h-9 sm:h-9.5 min-w-0"
                title="مراسلة عبر واتساب"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">واتساب</span>
              </a>
            )}

            {/* Share Button (Shortened & Compact to fit completely on all screens) */}
            <button
              type="button"
              onClick={handleShare}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2 py-1.5 font-display text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer text-center h-9 sm:h-9.5 min-w-0 ${
                isCopied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
              title="مشاركة رابط وبيانات المتجر"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
              ) : (
                <Share2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{isCopied ? 'تم النسخ' : 'مشاركة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verified Store Ad Modal for this Store (10,000 IQD / month) */}
      {isAdBookingOpen && (
        <VerifiedStoreAdModal
          isOpen={isAdBookingOpen}
          onClose={() => setIsAdBookingOpen(false)}
          initialScope="store_area"
        />
      )}
    </div>
  );
};
