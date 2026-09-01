import React, { useState } from 'react';
import {
  X,
  Bell,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Send,
  PlusCircle,
  Tag,
  Store,
  Flame,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { NotificationItem } from '../types/shatrah';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectNotification,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    broadcastNotification,
    broadcastNewOfferNotification,
    broadcastNewStoreNotification,
    soundEnabled,
    setSoundEnabled,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'all' | 'offer' | 'store' | 'broadcast'>('all');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customType, setCustomType] = useState<'offer' | 'store' | 'news'>('offer');
  const [isBroadcastSent, setIsBroadcastSent] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'offer') return n.type === 'offer';
    if (activeTab === 'store') return n.type === 'store';
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (onSelectNotification) {
      onSelectNotification(item);
      onClose();
    }
  };

  const handleSendCustomBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customMessage.trim()) return;

    broadcastNotification({
      title: customTitle,
      message: customMessage,
      type: customType,
      badge: customType === 'offer' ? 'عرض فوري' : customType === 'store' ? 'متجر جديد' : 'تنبيه',
    });

    setCustomTitle('');
    setCustomMessage('');
    setIsBroadcastSent(true);
    setTimeout(() => {
      setIsBroadcastSent(false);
      setActiveTab('all');
    }, 1500);
  };

  const handleTriggerQuickOfferDemo = () => {
    broadcastNewOfferNotification({
      id: 'offer-2',
      businessName: 'مجمع الأناقة التجاري',
      title: 'خصم 15% على ملابس الأطفال والسترات',
      discountPercentage: 'خصم 15%',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    });
  };

  const handleTriggerQuickStoreDemo = () => {
    broadcastNewStoreNotification({
      id: 'doc-3',
      name: 'عيادة د. سارة العبادي لطب الأسنان',
      category: 'الأطباء',
      address: 'شارع المستشفى العام - عمارة الشفاء',
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold text-xl shadow-md">
              🔔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold">
                  مركز الإشعارات والتنبيهات التلقائية
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                تصل تلقائياً لجميع المستخدمين عند نشر العروض والمتاجر الجديدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>الكل ({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offer')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'offer'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-red-500" />
            <span>عروض وتخفيضات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Store className="h-3.5 w-3.5 text-blue-500" />
            <span>متاجر جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>بث إشعار 📣</span>
          </button>
        </div>

        {/* Quick Demo Test Bar */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            تجربة البث الفوري التلقائي:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleTriggerQuickOfferDemo}
              className="rounded-lg bg-white border border-amber-300 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-amber-100/70 cursor-pointer shadow-2xs"
            >
              + تجربة إشعار عرض 🔥
            </button>
            <button
              type="button"
              onClick={handleTriggerQuickStoreDemo}
              className="rounded-lg bg-white border border-amber-300 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-amber-100/70 cursor-pointer shadow-2xs"
            >
              + تجربة إشعار متجر 🏪
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {activeTab === 'broadcast' ? (
            /* Broadcast Composer for Admin/Manager */
            <form onSubmit={handleSendCustomBroadcast} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                <h4 className="font-display font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Send className="h-4 w-4 text-red-600" />
                  إرسال إشعار فوري لجميع مستخدمي تطبيق الشطرة
                </h4>
                <p className="text-slate-500">
                  عند إرسال هذا الإشعار سيظهر فورا في أعلى شاشة جميع المستخدمين مع صوت تنبيه وإضافته إلى سجل إشعاراتهم.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-display text-xs font-bold text-slate-700">
                  نوع الإشعار:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'offer', name: '🔥 عرض وتخفيض' },
                    { id: 'store', name: '🛍️ متجر جديد' },
                    { id: 'news', name: '📢 تنبيه عام' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCustomType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        customType === t.id
                          ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  عنوان الإشعار *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="مثال: خصم 25% في مجمع الشطرة الحديث..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  نص وتفاصيل الإشعار *
                </label>
                <textarea
                  required
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="اكتب رسالة الإشعار الترويجية التي ستظهر للمستخدمين..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {isBroadcastSent && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-in fade-in">
                  <Check className="h-4 w-4" />
                  <span>تم إرسال وبث الإشعار التلقائي لجميع المستخدمين بنجاح!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>بث الإشعار التلقائي لجميع المستخدمين الآن 🚀</span>
              </button>
            </form>
          ) : (
            /* Notifications List */
            <div className="space-y-2.5">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`rounded-2xl border p-3.5 transition-all cursor-pointer group ${
                      item.unread
                        ? 'border-amber-300/80 bg-amber-50/50 shadow-xs hover:border-amber-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {item.type === 'offer' ? '🔥' : item.type === 'store' ? '🏪' : '📢'}
                        </span>
                        <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.badge && (
                          <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {item.time}
                        </span>
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed pr-6">
                      {item.message}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-red-600 font-bold flex items-center gap-1 group-hover:underline">
                        <span>اضغط لعرض التفاصيل</span>
                        <ArrowLeft className="h-3 w-3" />
                      </span>

                      {item.unread && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          ● جديد
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-xs text-slate-600">لا توجد إشعارات في هذا القسم</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-3 bg-slate-50 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            <span>تعيين الكل كمقروء</span>
          </button>

          <button
            type="button"
            onClick={clearAllNotifications}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>مسح الكل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
