import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Edit3,
  X,
  Save,
  ShieldCheck,
  Clock,
  Globe2,
  Crown,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Tag,
  Sparkles,
  PlusCircle,
  Building,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useWallet } from '../context/WalletContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useDirectory } from '../context/DirectoryContext';
import { useLocation } from '../context/LocationContext';
import { VerifiedStoreAdModal } from './VerifiedStoreAdModal';
import { DirectoryItem } from '../types/directory';
import { CategoryAd } from '../types/shatrah';
import { formatIraqWhatsAppNumber } from '../utils/socialLinks';

interface IraqMainAnnouncementBannerProps {
  onOpenManagerModal?: () => void;
  onOpenClaimStoreModal?: (store?: DirectoryItem) => void;
}

export const IraqMainAnnouncementBanner: React.FC<IraqMainAnnouncementBannerProps> = ({
  onOpenManagerModal,
  onOpenClaimStoreModal,
}) => {
  const { mainAnnouncement, updateMainAnnouncement } = useNotification();
  const { isManagerUnlocked } = useWallet();
  const { getNationalAds, getGovernorateAds } = useCategoryAds();
  const { items, claimedStoreIds, isUserStoreOwner } = useDirectory();
  const { currentLocation } = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [isVerifiedAdModalOpen, setIsVerifiedAdModalOpen] = useState(false);

  // Edit form state for main announcement
  const [editTitle, setEditTitle] = useState(mainAnnouncement.title);
  const [editMessage, setEditMessage] = useState(mainAnnouncement.message);

  // Check if current device user has any verified/claimed stores
  const hasVerifiedStore = useMemo(() => {
    return items.some(
      (s) =>
        claimedStoreIds.includes(s.id) ||
        isUserStoreOwner(s.id) ||
        (s.claimedByPhone && s.phoneReliability === 'otp_verified')
    );
  }, [items, claimedStoreIds, isUserStoreOwner]);

  // Combine central announcement + active national & governorate sponsored ads
  const combinedItems = useMemo(() => {
    const list: Array<{ type: 'announcement'; id: string } | { type: 'ad'; id: string; ad: CategoryAd }> = [
      { type: 'announcement', id: 'main-central-announcement' },
    ];

    const nationalAds = getNationalAds();
    const govAds =
      currentLocation.governorateId && currentLocation.governorateId !== 'all'
        ? getGovernorateAds(currentLocation.governorateId)
        : [];

    const seen = new Set<string>();
    [...nationalAds, ...govAds].forEach((ad) => {
      if (!seen.has(ad.id)) {
        seen.add(ad.id);
        list.push({ type: 'ad', id: ad.id, ad });
      }
    });

    return list;
  }, [getNationalAds, getGovernorateAds, currentLocation.governorateId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // 15-second rotation timer per requirement
  const ROTATION_SECONDS = 15;

  useEffect(() => {
    if (combinedItems.length <= 1) {
      setProgressPercent(0);
      return;
    }

    const intervalMs = 100;
    const stepIncrement = 100 / ((ROTATION_SECONDS * 1000) / intervalMs);

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % combinedItems.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [combinedItems.length, currentIndex]);

  const activeItem = combinedItems[currentIndex] || combinedItems[0];

  const handleNext = () => {
    if (combinedItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % combinedItems.length);
    setProgressPercent(0);
  };

  const handlePrev = () => {
    if (combinedItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
    setProgressPercent(0);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(mainAnnouncement.title);
    setEditMessage(mainAnnouncement.message);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editMessage.trim()) return;

    updateMainAnnouncement({
      title: editTitle.trim(),
      message: editMessage.trim(),
    });

    setIsEditing(false);
  };

  // Formatted date for announcement
  const updatedDate = new Date(mainAnnouncement.updatedAt).toLocaleDateString('ar-IQ', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* المستطيل الأزرق: لوحة الإشعارات والإعلانات لعموم العراق */}
      <section
        id="main-iraq-blue-rectangle"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 p-3.5 sm:p-4 text-white shadow-md shadow-sky-900/20 border border-sky-400/30 transition-all duration-200"
      >
        {/* Subtle decorative background blur elements */}
        <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-sky-300/15 blur-xl" />

        {/* 15-second visual progress bar at top if multiple items rotate */}
        {combinedItems.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="relative z-10 space-y-3">
          {/* Top Bar inside the Blue Box: Badge, Rotation indicator, and Action buttons */}
          <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-5 items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-200 backdrop-blur-xs border border-white/15 shadow-2xs">
                <span className="text-xs">🇮🇶</span>
                <span>لوحة الإشعارات والإعلانات المعتمدة</span>
              </span>

              {activeItem.type === 'ad' ? (
                <span className="flex items-center gap-1 rounded-lg bg-rose-600/90 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                  <Crown className="h-3 w-3 text-amber-300" />
                  <span>إعلان متجر موثق</span>
                  {activeItem.ad.offerBadge && ` • ${activeItem.ad.offerBadge}`}
                </span>
              ) : (
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-bold text-sky-100 bg-blue-900/40 px-2 py-0.5 rounded-lg border border-white/10">
                  <Globe2 className="h-3 w-3 text-amber-300" />
                  <span>شامل كافة المحافظات</span>
                </span>
              )}
            </div>

            {/* Right Controls: Rotation Indicator & Modals Triggers */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {combinedItems.length > 1 && (
                <div className="flex items-center gap-1 bg-blue-950/50 border border-white/15 rounded-xl px-2 py-0.5 text-[10px] font-bold text-sky-200">
                  <Clock className="h-3 w-3 text-amber-300" />
                  <span>{currentIndex + 1} من {combinedItems.length}</span>
                  <span className="hidden sm:inline text-sky-300 text-[9px]">(كل 15 ثانية)</span>
                </div>
              )}

              {/* Prev / Next Arrows */}
              {combinedItems.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    title="السابق"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    title="التالي"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Manager Edit Button */}
              {isManagerUnlocked && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] px-2.5 py-1 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="تعديل الإشعار المركزي (خاص بالمدير)"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>تعديل الإشعار</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Body (Announcement or Sponsored Ad) */}
          {activeItem.type === 'announcement' ? (
            /* OFFICIAL ANNOUNCEMENT VIEW */
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-amber-300 shadow-inner border border-white/25 text-xl">
                <Megaphone className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xs sm:text-sm font-extrabold text-white leading-snug">
                  {mainAnnouncement.title}
                </h3>
                <p className="mt-1 text-xs text-sky-50 font-medium leading-relaxed">
                  {mainAnnouncement.message}
                </p>
              </div>
            </div>
          ) : (
            /* SPONSORED AD FOR VERIFIED STORE */
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 text-right">
              <div className="flex items-center sm:items-start gap-3 w-full sm:w-auto">
                {activeItem.ad.imageUrl && (
                  <img
                    src={activeItem.ad.imageUrl}
                    alt={activeItem.ad.businessName}
                    className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover border-2 border-amber-300 shadow-md flex-shrink-0"
                  />
                )}

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display text-sm sm:text-base font-black text-white leading-tight">
                      {activeItem.ad.businessName}
                    </h4>
                    <span className="rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 text-[9px] font-black">
                      ✓ متجر موثق
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-black text-amber-300 leading-snug line-clamp-2">
                    {activeItem.ad.headline}
                  </p>

                  {activeItem.ad.description && activeItem.ad.description !== activeItem.ad.headline && (
                    <p className="text-[11px] text-sky-100 line-clamp-1">
                      {activeItem.ad.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Direct Call & WhatsApp Action Buttons for the Store */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-1 sm:pt-0">
                {activeItem.ad.phone && (
                  <a
                    href={`tel:${activeItem.ad.phone}`}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>اتصال فوري</span>
                  </a>
                )}

                {activeItem.ad.whatsapp && (
                  <a
                    href={`https://wa.me/${formatIraqWhatsAppNumber(activeItem.ad.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-2 text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>واتساب</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Integrated Action Strip inside the Blue Board ("وداخلها التفاصيل") */}
          <div className="pt-2.5 border-t border-white/20 flex flex-col md:flex-row items-center justify-end gap-2.5">
            {/* Clickable Action for Verified Store Owners ("يضغط عليها صاحب المتجر الموثق حسابه ويضع الاعلان") */}
            <button
              type="button"
              onClick={() => setIsVerifiedAdModalOpen(true)}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs px-4 py-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 w-full md:w-auto"
            >
              <Crown className="h-4 w-4 text-slate-950 fill-slate-950 transition-transform group-hover:rotate-12" />
              <span>اضغط هنا لوضع إعلانك (للمتاجر الموثقة 👑)</span>
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* MODAL: VERIFIED STORE AD PLACEMENT FLOW */}
      <VerifiedStoreAdModal
        isOpen={isVerifiedAdModalOpen}
        onClose={() => setIsVerifiedAdModalOpen(false)}
        initialScope="national"
        onOpenClaimStore={onOpenClaimStoreModal}
      />

      {/* MODAL: DIRECT MANAGER EDIT FOR CENTRAL ANNOUNCEMENT */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-white">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-sky-700 px-5 py-3.5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-bold">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-extrabold text-white">
                    تعديل إشعار المستطيل الأزرق (كل العراق)
                  </h4>
                  <p className="text-[10px] text-sky-200">
                    خاص فقط بالمدير • يظهر لجميع محافظات العراق
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان الإشعار الرئيسي *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="مثال: 🇮🇶 إشعار العراق العام • تنبيه الإدارة المركزية"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نص الإشعار / الرسالة *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  placeholder="اكتب التنبيه أو التوجيه الذي سيصل لجميع أنحاء العراق ككل..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white focus:border-sky-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="rounded-xl bg-blue-950/60 border border-blue-800/80 p-3 text-[11px] text-sky-200 leading-relaxed">
                📌 بمجرد الحفظ، سيتحدث المستطيل الأزرق فوراً ويشاهده كافة مستخدمي التطبيق في جميع محافظات العراق.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 py-2.5 text-xs font-black text-white shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ وتحديث الإشعار الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
