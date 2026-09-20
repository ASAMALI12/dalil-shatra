import React, { useState } from 'react';
import {
  X,
  Bell,
  Sparkles,
  Trash2,
  Phone,
  MessageCircle,
  ArrowLeft,
  Store,
  Tag,
  MapPin,
  Check,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useDirectory } from '../context/DirectoryContext';
import { NotificationItem, DirectoryItem } from '../types/shatrah';

interface CategoryNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  onSelectNotification?: (notif: NotificationItem) => void;
  onSelectItem?: (item: DirectoryItem) => void;
}

export const CategoryNotificationsModal: React.FC<CategoryNotificationsModalProps> = ({
  isOpen,
  onClose,
  governorateId,
  governorateName,
  districtId,
  districtName,
  categoryId,
  categoryName,
  categoryIcon,
  onSelectNotification,
  onSelectItem,
}) => {
  const {
    getNotificationsForCategory,
    markAsRead,
    markCategoryAsRead,
    deleteNotification,
  } = useNotification();
  const { getAdsForCategory } = useCategoryAds();
  const { items } = useDirectory();

  const [activeFilter, setActiveFilter] = useState<'all' | 'offer' | 'store'>('all');

  if (!isOpen) return null;

  const categoryNotifications = getNotificationsForCategory(
    governorateId,
    districtId,
    categoryId
  );

  // Active sponsored category ads for this category & district
  const categoryAds = getAdsForCategory(governorateId, districtId, categoryId);

  const filteredNotifications = categoryNotifications.filter((n) => {
    if (activeFilter === 'offer') return n.type === 'offer';
    if (activeFilter === 'store') return n.type === 'store';
    return true;
  });

  const unreadCount = categoryNotifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
    if (onSelectItem) {
      const targetId = notif.storeId || notif.targetId;
      const found = items.find(
        (i) => (targetId && i.id === targetId) || (notif.title && i.name && notif.title.includes(i.name))
      );
      const targetItem: DirectoryItem = found || {
        id: targetId || notif.id,
        name: notif.title.replace(/^[🔥🎉🍕🐟📍⭐📢🍽️🏨🛍️🍲☕🥩📱\s]+/, '').replace(/^عرض خاص:\s*/, '').replace(/^متجر جديد:\s*/, ''),
        category: notif.categoryName || notif.categoryId || categoryName || 'المحلات والأنشطة',
        governorateId: notif.governorateId || governorateId,
        governorateName: notif.governorateName || governorateName,
        districtId: notif.districtId || districtId,
        districtName: notif.districtName || districtName,
        address: notif.districtName ? `${notif.governorateName || governorateName} - ${notif.districtName}` : (notif.governorateName || governorateName || 'العراق'),
        phone: (notif as any).phone || '07700000000',
        rating: null,
        reviewsCount: 0,
        isOpen: true,
        workingHours: '09:00 ص - 11:00 م',
        imageUrl: notif.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        description: notif.message,
        tags: [notif.badge || 'عرض خاص', notif.districtName || notif.governorateName || districtName].filter(Boolean),
        isClaimed: true,
        claimStatus: 'verified',
      };
      onSelectItem(targetItem);
    }
    onClose();
  };

  const handleAdClick = (ad: any) => {
    if (onSelectItem) {
      const found = items.find(
        (i) => i.id === ad.storeId || i.id === ad.id || (ad.businessName && i.name === ad.businessName)
      );
      const targetItem: DirectoryItem = found || {
        id: ad.storeId || ad.id,
        name: ad.businessName,
        category: ad.categoryName || categoryName || 'المحلات والأنشطة',
        governorateId: ad.governorateId || governorateId,
        governorateName: ad.governorateName || governorateName,
        districtId: ad.districtId || districtId,
        districtName: ad.districtName || districtName,
        address: `${ad.governorateName || governorateName} - ${ad.districtName || districtName}`,
        phone: ad.phone || '07700000000',
        whatsapp: ad.whatsapp,
        rating: null,
        reviewsCount: 0,
        isOpen: true,
        workingHours: '09:00 ص - 11:00 م',
        imageUrl: ad.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        description: `${ad.headline} - ${ad.description}`,
        tags: [ad.offerBadge || 'إعلان مثبت', ad.districtName || districtName].filter(Boolean),
        isClaimed: true,
        claimStatus: 'verified',
      };
      onSelectItem(targetItem);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Slim Top Bar without any bulky titles or banners */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 text-white px-3 sm:px-4 py-2 gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs sm:text-sm ${
                activeFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              الكل ({categoryNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('offer')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 text-xs sm:text-sm ${
                activeFilter === 'offer'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>العروض</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('store')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 text-xs sm:text-sm ${
                activeFilter === 'store'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>الأنشطة</span>
            </button>
          </div>

          {/* Quick Actions: Mark as read & Close button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  markCategoryAsRead(governorateId, districtId, categoryId)
                }
                title="تحديد الكل كمقروء"
                className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white transition-colors cursor-pointer bg-slate-800 px-2.5 py-1.5 rounded-xl"
              >
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">قراءة الكل</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title="إغلاق"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Active Category Ads Highlight Section if any */}
          {categoryAds.length > 0 && activeFilter !== 'store' && (
            <div className="mb-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>إعلانات مميزة نشطة في {districtName}</span>
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">
                  مثبتة بالصدارة
                </span>
              </div>

              {categoryAds.map((ad, adIndex) => (
                <div
                  key={`${ad.id || 'ad'}-${adIndex}`}
                  onClick={() => handleAdClick(ad)}
                  className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-3 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex gap-3 items-start">
                    {ad.imageUrl && (
                      <img
                        src={ad.imageUrl}
                        alt={ad.businessName}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-xl object-cover border border-amber-200 shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-xs sm:text-sm font-extrabold text-slate-900 truncate group-hover:text-amber-900">
                          {ad.businessName}
                        </h4>
                        {ad.offerBadge && (
                          <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-2xs whitespace-nowrap">
                            {ad.offerBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {ad.headline} - {ad.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/60 flex-wrap">
                        {ad.phone && (
                          <a
                            href={`tel:${ad.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/90 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Phone className="h-3 w-3" />
                            <span>اتصال</span>
                          </a>
                        )}
                        {ad.whatsapp && (
                          <a
                            href={`https://wa.me/964${ad.whatsapp.replace(/^0+/, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>واتساب</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdClick(ad);
                          }}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer mr-auto"
                        >
                          <span>عرض النشاط</span>
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notifications List */}
          {filteredNotifications.length === 0 && categoryAds.length === 0 ? (
            <div className="py-10 text-center px-4 space-y-3">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-sky-50 border border-sky-100 text-sky-600 text-3xl shadow-inner">
                {categoryIcon || '🔔'}
              </div>
              <h4 className="font-display text-sm font-black text-slate-800">
                لا توجد إشعارات أو عروض حالية في قسم {categoryName} بـ {districtName}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                نظام دليل العراق محلي ومحدد: تظهر لك إشعارات قضاء {districtName} فقط دون أي إزعاج من المحافظات الأخرى. ستصلك التنبيهات هنا فور نشر أي عرض جديد.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif, notifIndex) => (
                <div
                  key={`${notif.id || 'cat-notif'}-${notifIndex}`}
                  onClick={() => handleNotificationClick(notif)}
                  className={`relative rounded-2xl border p-4 sm:p-4.5 transition-all cursor-pointer active:scale-[0.99] ${
                    notif.unread
                      ? 'bg-sky-50/90 border-sky-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-3.5 items-start">
                    {notif.imageUrl ? (
                      <img
                        src={notif.imageUrl}
                        alt={notif.title}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${
                          notif.type === 'offer'
                            ? 'bg-amber-100 text-amber-700'
                            : notif.type === 'store'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {notif.type === 'offer' ? '🏷️' : notif.type === 'store' ? '🏪' : '🔔'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                          {notif.title}
                        </h4>
                        {notif.badge && (
                          <span className="rounded-lg bg-amber-500 px-2 py-0.5 text-xs font-black text-white shrink-0">
                            {notif.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal sm:font-medium">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-bold">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-sky-600" />
                          <span>{notif.districtName || districtName}</span>
                          <span>•</span>
                          <span>{notif.time}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sky-600 font-bold hover:underline flex items-center gap-0.5">
                            <span>عرض التفاصيل</span>
                            <ArrowLeft className="h-3 w-3" />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="حذف الإشعار"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
