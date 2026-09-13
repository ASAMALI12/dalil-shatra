import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Tag,
  Store,
  Flame,
  ChevronLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  ExternalLink,
  MapPin,
  Compass,
} from 'lucide-react';
import { useNotification, isNotificationInLocation } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { NotificationItem } from '../types/shatrah';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
  initialScope?: 'all' | 'local';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectNotification,
  initialScope = 'all',
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    soundEnabled,
    setSoundEnabled,
  } = useNotification();
  const { currentLocation } = useLocation();

  const [activeTab, setActiveTab] = useState<'all' | 'offer' | 'store' | 'system'>('all');
  const [locationFilter, setLocationFilter] = useState<'local' | 'all'>(initialScope || 'all');

  // Sync locationFilter when opened
  React.useEffect(() => {
    if (isOpen && initialScope) {
      setLocationFilter(initialScope);
    }
  }, [isOpen, initialScope]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Exclude any external news items from notifications
      if (n.type === 'news' || n.targetType === 'news' || String(n.id).startsWith('live-notif-')) {
        return false;
      }

      // 1. Location filter:
      if (locationFilter === 'local') {
        if (!isNotificationInLocation(n, currentLocation.governorateId, currentLocation.districtId)) {
          return false;
        }
      }

      // 2. Tab filter:
      if (activeTab === 'offer') return n.type === 'offer';
      if (activeTab === 'store') return n.type === 'store';
      if (activeTab === 'system') return n.type === 'system' || !n.type;

      return true;
    });
  }, [notifications, activeTab, locationFilter, currentLocation]);

  if (!isOpen) return null;

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (onSelectNotification) {
      onSelectNotification(item);
      onClose();
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'offer':
        return { icon: <Flame className="h-4 w-4 text-red-600" />, bg: 'bg-red-50 border-red-200' };
      case 'store':
        return { icon: <Store className="h-4 w-4 text-sky-600" />, bg: 'bg-sky-50 border-sky-200' };
      case 'system':
      default:
        return { icon: <Bell className="h-4 w-4 text-amber-600" />, bg: 'bg-amber-50 border-amber-200' };
    }
  };

  const currentAreaName =
    currentLocation.districtName && currentLocation.districtName !== 'كل الأقضية'
      ? currentLocation.districtName
      : currentLocation.governorateName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[92vh] flex flex-col border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slim Top Bar without any bulky titles or banners */}
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-900 text-white px-3 sm:px-4 py-2 gap-2">
          {/* Filter Tabs */}
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

            {/* Local / All Iraq compact toggle */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs font-bold mr-1">
              <button
                type="button"
                onClick={() => setLocationFilter('local')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[11px] sm:text-xs ${
                  locationFilter === 'local'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {currentAreaName}
              </button>
              <button
                type="button"
                onClick={() => setLocationFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[11px] sm:text-xs ${
                  locationFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                كل المحافظات
              </button>
            </div>
          </div>

          {/* Quick Actions & Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                title="تحديد الكل كمقروء"
                className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 px-2 py-1 bg-slate-800 rounded-xl cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">قراءة الكل</span>
              </button>
            )}

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-amber-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="إغلاق"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 text-2xl">
                🔔
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-slate-700">
                  لا توجد إشعارات أو أخبار في هذا القسم
                </h4>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  ستصلك التنبيهات الفورية والأخبار المعتمدة فور إضافة عروض أو فعاليات جديدة.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif, notifIndex) => {
              const iconStyle = getNotificationIcon(notif.type);
              const hasAction = Boolean(notif.targetId || notif.targetType);

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
                    {/* Category Icon */}
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${iconStyle.bg}`}
                    >
                      {iconStyle.icon}
                    </div>

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
                            {notif.time}
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

                      {/* Clear, legible notification / news text */}
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
                      </div>

                      {hasAction && (
                        <div className="pt-2 flex items-center gap-1 text-xs sm:text-sm font-extrabold text-sky-600 group-hover:text-sky-700">
                          <span>عرض التفاصيل المباشرة</span>
                          <ChevronLeft className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-xs text-slate-500 font-medium">
            دليل العراق • نظام الإشعارات والأخبار الذكي
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
