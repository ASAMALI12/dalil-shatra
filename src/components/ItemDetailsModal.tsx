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
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useWallet } from '../context/WalletContext';

interface ItemDetailsModalProps {
  item: DirectoryItem | null;
  onClose: () => void;
  onClaimStore?: (store: DirectoryItem) => void;
  onEditStore?: (store: DirectoryItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onClaimStore,
  onEditStore,
}) => {
  const { deleteStore, isUserStoreOwner } = useDirectory();
  const { isManagerUnlocked } = useWallet();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!item) return null;

  const isOwner = isUserStoreOwner(item.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `${item.name} - ${item.subCategory || item.category} في مدينة الشطرة`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(window.location.href);
      alert('تم نسخ رابط المكان للمشاركة');
    }
  };

  const handleDelete = () => {
    deleteStore(item.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-[16/9] w-full bg-slate-100 flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

          {/* Navigation Bar over image: Back button, Share button & Close button */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
            {/* Back Button (زر العودة للقائمة السابقة) */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white px-3.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
            >
              <ArrowRight className="h-4 w-4" />
              <span>رجوع للقائمة</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-950 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/20"
                title="مشاركة"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-950 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/20"
                title="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block rounded-lg bg-red-600/90 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                  {item.subCategory || 'دليل الشطرة'}
                </span>
                {item.isClaimed && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/90 text-slate-950 px-2 py-0.5 text-[10px] font-bold">
                    <Crown className="h-3 w-3" />
                    موثق لمالكه
                  </span>
                )}
              </div>
              <h3 className="mt-1 font-display text-lg sm:text-xl font-bold text-white drop-shadow-md">
                {item.name}
              </h3>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-amber-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
              <span>{item.rating}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4 text-slate-800 flex-1">
          {/* CLAIM STORE / OWNER VERIFICATION BANNER */}
          {isOwner ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-emerald-950">
                    أنت المالك الموثق لهذا المتجر 👑
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    {item.claimedByName ? `المسجل: ${item.claimedByName} • ` : ''}يمكنك تعديل البيانات وبث العروض
                  </p>
                </div>
              </div>

              {onEditStore && (
                <button
                  type="button"
                  onClick={() => onEditStore(item)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>تعديل المتجر</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white flex-shrink-0 shadow-xs">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xs font-bold text-amber-950 truncate">
                      هل أنت صاحب هذا المتجر؟
                    </span>
                    <span className="rounded-md bg-amber-200/80 text-amber-900 text-[9px] font-bold px-1.5 py-0.2">
                      تأكيد الهاتف
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 truncate">
                    طالب بمتجرك وأكّد رقم هاتفك بالواتساب لإدارته ونشر العروض
                  </p>
                </div>
              </div>

              {onClaimStore && (
                <button
                  type="button"
                  onClick={() => onClaimStore(item)}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  المطالبة بالمتجر 🔑
                </button>
              )}
            </div>
          )}

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

          {/* Address */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
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
                    هل أنت متأكد من حذف ({item.name}) نهائياً من قاعدة بيانات الشطرة؟
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
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/80 flex items-center gap-2">
          {/* Direct Phone Call */}
          <a
            href={`tel:${item.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all text-center"
          >
            <Phone className="h-4 w-4" />
            <span>اتصال ({item.phone})</span>
          </a>

          {/* WhatsApp Chat */}
          {item.whatsapp && (
            <a
              href={`https://wa.me/${item.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>واتساب</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
