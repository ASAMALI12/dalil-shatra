import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Store,
  Flame,
  ChevronLeft,
  Volume2,
  VolumeX,
  MapPin,
  ExternalLink,
  Phone,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { NotificationItem, DirectoryItem } from '../types/shatrah';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
  onSelectItem?: (item: DirectoryItem) => void;
  initialScope?: 'all' | 'local';
  governorateId?: string;
  governorateName?: string;
  districtId?: string;
  districtName?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  navLevel?: 'governorates' | 'districts' | 'stores';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectNotification,
  onSelectItem,
  initialScope = 'all',
  governorateId,
  governorateName,
  districtId,
  districtName,
  categoryId,
  categoryName,
  categoryIcon,
  navLevel = 'governorates',
}) => {
  const {
    notifications,
    getNotificationsForCategory,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    soundEnabled,
    setSoundEnabled,
  } = useNotification();
  const { currentLocation } = useLocation();
  const { getAdsForCategory } = useCategoryAds();

  // Location fallbacks
  const effectiveGovId = governorateId || currentLocation.governorateId || 'all';
  const effectiveGovName = governorateName || currentLocation.governorateName || '';
  const effectiveDistId = districtId || currentLocation.districtId || 'all';
  const effectiveDistName =
    districtName && districtName !== 'الكل' && districtName !== 'all'
      ? districtName
      : currentLocation.districtName && currentLocation.districtName !== 'كل الأقضية'
      ? currentLocation.districtName
      : '';

  // Tabs: All, Offers, Stores, System
  const [activeTab, setActiveTab] = useState<'all' | 'offer' | 'store' | 'system'>('all');

  // Scope filter: Category, District, Governorate, All
  const [scopeFilter, setScopeFilter] = useState<'category' | 'district' | 'governorate' | 'all'>('all');

  // Sync initial scope whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      if (navLevel === 'stores' && categoryId && categoryId !== 'all') {
        setScopeFilter('category');
      } else if (navLevel === 'stores' && effectiveDistId && effectiveDistId !== 'all') {
        setScopeFilter('district');
      } else if (navLevel === 'districts' && effectiveGovId && effectiveGovId !== 'all') {
        setScopeFilter('governorate');
      } else if (initialScope === 'local') {
        setScopeFilter(effectiveDistId && effectiveDistId !== 'all' ? 'district' : 'governorate');
      } else {
        setScopeFilter('all');
      }
    }
  }, [isOpen, navLevel, categoryId, effectiveDistId, effectiveGovId, initialScope]);

  // Retrieve relevant pinned ads when in category or district scope
  const relevantAds = useMemo(() => {
    if (!isOpen) return [];
    if (scopeFilter === 'category' && categoryId) {
      return getAdsForCategory(effectiveGovId, effectiveDistId, categoryId);
    }
    if (scopeFilter === 'district' && effectiveDistId && effectiveDistId !== 'all') {
      return getAdsForCategory(effectiveGovId, effectiveDistId, 'all');
    }
    return [];
  }, [isOpen, scopeFilter, categoryId, effectiveGovId, effectiveDistId, getAdsForCategory]);

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    let list: NotificationItem[] = [];

    // Scope selection
    if (scopeFilter === 'category' && categoryId) {
      list = getNotificationsForCategory(effectiveGovId, effectiveDistId, categoryId);
    } else if (scopeFilter === 'district' && effectiveDistId && effectiveDistId !== 'all') {
      list = getNotificationsForCategory(effectiveGovId, effectiveDistId, 'all');
    } else if (scopeFilter === 'governorate' && effectiveGovId && effectiveGovId !== 'all') {
      list = getNotificationsForCategory(effectiveGovId, 'all', 'all');
    } else {
      // All notifications across Iraq
      list = notifications;
    }

    // Exclude live news tickers (strict rule: notifications are for app & stores only)
    list = list.filter((n) => {
      if (n.type === 'news' || n.targetType === 'news' || String(n.id).startsWith('live-notif-')) {
        return false;
      }
      return true;
    });

    // Tab filter
    if (activeTab === 'offer') {
      list = list.filter((n) => n.type === 'offer');
    } else if (activeTab === 'store') {
      list = list.filter((n) => n.type === 'store');
    } else if (activeTab === 'system') {
      list = list.filter((n) => n.type === 'system' || !n.type);
    }

    return list;
  }, [
    notifications,
    scopeFilter,
    categoryId,
    effectiveGovId,
    effectiveDistId,
    getNotificationsForCategory,
    activeTab,
  ]);

  if (!isOpen) return null;

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (onSelectNotification) {
      onSelectNotification(item);
      onClose();
    }
  };

  const handleAdClick = (ad: any) => {
    if (onSelectItem) {
      const syntheticItem: DirectoryItem = {
        id: ad.storeId || ad.id,
        name: ad.businessName || ad.headline,
        category: ad.categoryName || categoryName || 'المحلات',
        address: `${ad.governorateName || effectiveGovName} - ${ad.districtName || effectiveDistName}`,
        governorateId: ad.governorateId || effectiveGovId,
        governorateName: ad.governorateName || effectiveGovName,
        districtId: ad.districtId || effectiveDistId,
        districtName: ad.districtName || effectiveDistName,
        phone: ad.phone || '',
        whatsapp: ad.whatsapp || '',
        description: `${ad.headline || ''} - ${ad.description || ''}`,
        imageUrl: ad.imageUrl || '',
        isClaimed: true,
        claimStatus: 'verified',
        workingHours: '09:00 ص - 11:00 م',
        tags: [ad.offerBadge || 'إعلان مثبت', ad.districtName || effectiveDistName].filter(Boolean) as string[],
        featured: true,
        rating: 4.9,
        reviewsCount: 1,
        isOpen: true,
        itemType: 'store',
        source: 'manual_registration',
      };
      onSelectItem(syntheticItem);
      onClose();
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'offer':
        return { icon: <Flame className="h-4 w-4 text-rose-600" />, bg: 'bg-rose-50 border-rose-200' };
      case 'store':
        return { icon: <Store className="h-4 w-4 text-sky-600" />, bg: 'bg-sky-50 border-sky-200' };
      case 'system':
      default:
        return { icon: <Bell className="h-4 w-4 text-amber-600" />, bg: 'bg-amber-50 border-amber-200' };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[92vh] flex flex-col border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-900 text-white px-3 sm:px-4 py-2.5 gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'offer', label: 'العروض' },
              { id: 'store', label: 'المتاجر' },
              { id: 'system', label: 'تنبيهات التطبيق' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              className="rounded-xl p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5 text-rose-400" />}
            </button>
            <button
              type="button"
              onClick={() => markAllAsRead()}
              title="تحديد الكل كمقروء"
              className="rounded-xl p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <CheckCheck className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => clearAllNotifications()}
              title="مسح جميع الإشعارات"
              className="rounded-xl p-1.5 text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="إغلاق"
              className="rounded-xl p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scope Selector Bar (Category, District, Governorate, All Iraq) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-3 sm:px-4 bg-slate-850 border-b border-slate-750 text-xs font-bold">
          <span className="text-[11px] text-slate-400 shrink-0 ml-1">نطاق الإشعارات:</span>

          {/* 1. Category / Store Scope (if category is present) */}
          {categoryName && (
            <button
              type="button"
              onClick={() => setScopeFilter('category')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold whitespace-nowrap text-xs flex items-center gap-1.5 ${
                scopeFilter === 'category'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>{categoryIcon || '🏬'}</span>
              <span>{categoryName}</span>
            </button>
          )}

          {/* 2. District / City Scope (if district is selected) */}
          {effectiveDistName && (
            <button
              type="button"
              onClick={() => setScopeFilter('district')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold whitespace-nowrap text-xs flex items-center gap-1.5 ${
                scopeFilter === 'district'
                  ? 'bg-sky-500 text-white shadow-xs ring-2 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{effectiveDistName}</span>
            </button>
          )}

          {/* 3. Governorate Scope */}
          {effectiveGovName && (
            <button
              type="button"
              onClick={() => setScopeFilter('governorate')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold whitespace-nowrap text-xs flex items-center gap-1.5 ${
                scopeFilter === 'governorate'
                  ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>🏛️</span>
              <span>{effectiveGovName}</span>
            </button>
          )}

          {/* 4. All Iraq */}
          <button
            type="button"
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold whitespace-nowrap text-xs flex items-center gap-1.5 ${
              scopeFilter === 'all'
                ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>🇮🇶</span>
            <span>كل المحافظات</span>
          </button>
        </div>

        {/* Notifications & Ads List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Pinned / VIP Ads for this scope */}
          {relevantAds.length > 0 && (
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>عروض وإعلانات مثبتة في {scopeFilter === 'category' ? categoryName : effectiveDistName}</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {relevantAds.map((ad) => (
                  <div
                    key={`ad-${ad.id}`}
                    onClick={() => handleAdClick(ad)}
                    className="group relative rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-white p-3.5 sm:p-4 transition-all shadow-xs hover:shadow-md cursor-pointer text-right"
                  >
                    <div className="flex items-start gap-3">
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.headline || ad.businessName}
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-amber-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-sm sm:text-base font-black text-slate-900 leading-snug">
                            {ad.headline}
                          </h4>
                          {ad.offerBadge && (
                            <span className="rounded-lg bg-rose-600 text-white px-2 py-0.5 text-[11px] font-black shrink-0 shadow-2xs">
                              {ad.offerBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 leading-relaxed font-normal">
                          {ad.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap text-xs font-bold">
                          <span className="text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md font-extrabold text-[11px]">
                            {ad.businessName}
                          </span>
                          {(ad.districtName || ad.governorateName) && (
                            <span className="text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {ad.districtName || ad.governorateName}
                            </span>
                          )}
                          <div className="mr-auto flex items-center gap-1 text-sky-700 font-extrabold text-xs group-hover:text-sky-800">
                            <span>عرض التفاصيل</span>
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Notifications */}
          {filteredNotifications.length === 0 && relevantAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 text-2xl">
                🔔
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-slate-700">
                  لا توجد إشعارات في هذا النطاق حالياً
                </h4>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  ستصلك التنبيهات الفورية الخاصة بالتطبيق والأنشطة التجارية فور إضافتها.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif, notifIndex) => {
              const iconStyle = getNotificationIcon(notif.type);
              const hasAction = Boolean(notif.targetId || notif.targetType || notif.storeId);

              return (
                <div
                  key={`${notif.id || 'notif'}-${notifIndex}`}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative rounded-2xl border p-4 sm:p-5 transition-all text-right ${
                    notif.unread
                      ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                  } ${hasAction ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Icon or Thumbnail */}
                    {notif.imageUrl ? (
                      <img
                        src={notif.imageUrl}
                        alt={notif.title}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${iconStyle.bg}`}
                      >
                        {iconStyle.icon}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {notif.unread && (
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                          )}
                          <h4 className="font-display text-base sm:text-lg font-black text-slate-900 leading-snug">
                            {notif.title}
                          </h4>
                          {notif.badge && (
                            <span className="rounded-lg bg-amber-500 text-white px-2.5 py-0.5 text-xs font-black shadow-2xs">
                              {notif.badge}
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Delete button */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-slate-400 font-bold">
                            {notif.time || 'الآن'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            title="حذف هذا الإشعار"
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer opacity-80 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Legible message text */}
                      <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal sm:font-medium">
                        {notif.message}
                      </p>

                      {/* Location & Category Badges */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-xs sm:text-sm font-bold">
                        <span className="flex items-center gap-1.5 text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 font-extrabold">
                          <MapPin className="h-3.5 w-3.5 text-sky-600" />
                          <span>{notif.districtName || notif.governorateName || 'العراق عام'}</span>
                        </span>
                        {notif.categoryName && (
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                            {notif.categoryName}
                          </span>
                        )}
                        {hasAction && (
                          <div className="mr-auto flex items-center gap-1 text-xs sm:text-sm font-extrabold text-sky-600 group-hover:text-sky-700">
                            <span>عرض النشاط التجاري</span>
                            <ChevronLeft className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-150 bg-slate-50 px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-xs text-slate-500 font-medium">
            دليل العراق • نظام إشعارات وعروض التطبيق
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 font-bold transition-colors cursor-pointer text-xs sm:text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
