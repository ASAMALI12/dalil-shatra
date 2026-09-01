import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem, Offer, DirectoryItem } from '../types/shatrah';
import { NOTIFICATIONS_DATA } from '../data/shatrahData';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  broadcastNotification: (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  broadcastNewOfferNotification: (offer: Partial<Offer>) => void;
  broadcastNewStoreNotification: (store: Partial<DirectoryItem>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

// Simple Web Audio API synthesizer for native app notification chime
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    
    // First tone (pleasant high frequency)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {
    // AudioContext autoplay restrictions or disabled audio
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '🔥 عرض وتخفيض جديد: مطعم قصر المندي',
    message: 'تم نشر خصم 20% على جميع الوجبات العائلية والمندي بمناسبة العيد! اضغط للاطلاع على التفاصيل.',
    time: 'منذ 10 دقائق',
    timestamp: Date.now() - 1000 * 60 * 10,
    type: 'offer',
    unread: true,
    targetType: 'offer',
    targetId: 'offer-3',
    badge: 'تخفيض 20%',
  },
  {
    id: 'notif-2',
    title: '🛍️ متجر جديد: صيدلية النور الحديثة',
    message: 'تم إضافة صيدلية النور إلى دليل الشطرة - قسم الصيدليات (خدمة 24 ساعة واستشارات دوائية).',
    time: 'منذ 45 دقيقة',
    timestamp: Date.now() - 1000 * 60 * 45,
    type: 'store',
    unread: true,
    targetType: 'store',
    targetId: 'pharm-1',
    badge: 'متجر جديد',
  },
  {
    id: 'notif-3',
    title: '📢 تنبيه بلدي: جدول الصيدليات الخافرة',
    message: 'صيدلية النور وصيدلية الشفاء خافرتان الليلة لخدمة أهالي الشطرة على مدار الساعة.',
    time: 'منذ ساعتين',
    timestamp: Date.now() - 1000 * 60 * 120,
    type: 'news',
    unread: false,
    targetType: 'news',
    badge: 'صحة وطوارئ',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('shatrah_notifications_list');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('shatrah_notif_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('shatrah_notifications_list', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('shatrah_notif_sound', soundEnabled.toString());
  }, [soundEnabled]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const broadcastNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: 'الآن',
        timestamp: Date.now(),
        unread: true,
      };

      // Add to notifications list
      setNotifications((prev) => [newNotif, ...prev]);

      // Pop active toast automatically on screen for all users
      setActiveToast(newNotif);

      // Play sound chime if enabled
      if (soundEnabled) {
        playNotificationSound();
      }

      // Auto dismiss toast after 6.5 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.id === newNotif.id ? null : current));
      }, 6500);
    },
    [soundEnabled]
  );

  // Broadcast helper when a new offer is posted
  const broadcastNewOfferNotification = useCallback(
    (offer: Partial<Offer>) => {
      broadcastNotification({
        title: `🔥 عرض وتخفيض جديد: ${offer.businessName || 'نشاط تجاري'}`,
        message: `تم إضافة عرض جديد "${offer.title || 'عرض خاص'}" (${offer.discountPercentage || 'خصم مميز'}) - تصفح العرض الآن واستفد من الخصم!`,
        type: 'offer',
        targetType: 'offer',
        targetId: offer.id,
        imageUrl: offer.imageUrl,
        badge: offer.discountPercentage || 'عرض جديد',
      });
    },
    [broadcastNotification]
  );

  // Broadcast helper when a new store / place is added to directory
  const broadcastNewStoreNotification = useCallback(
    (store: Partial<DirectoryItem>) => {
      broadcastNotification({
        title: `🎉 متجر جديد في الشطرة: ${store.name || 'نشاط تجاري جديد'}`,
        message: `تم إضافة ${store.name || 'متجر جديد'} إلى قسم (${store.category || 'المحلات'}) في ${store.address || 'الشطرة'} - مرحبًا بكم لزيارته!`,
        type: 'store',
        targetType: 'store',
        targetId: store.id,
        imageUrl: store.imageUrl,
        badge: 'متجر جديد',
      });
    },
    [broadcastNotification]
  );

  // Auto demonstration on first launch after 2 seconds to show real-time broadcast in action
  useEffect(() => {
    const hasTriggeredWelcome = sessionStorage.getItem('shatrah_notif_welcome_triggered');
    if (!hasTriggeredWelcome) {
      sessionStorage.setItem('shatrah_notif_welcome_triggered', 'true');
      const timer = setTimeout(() => {
        broadcastNotification({
          title: '🔥 تنبيه فوري: عروض وتخفيضات اليوم في الشطرة',
          message: 'تم تفعيل التنبيهات التلقائية المباشرة لكل عروض وتخفيضات ومتاجر الشطرة الجديدة فور إضافتها!',
          type: 'offer',
          badge: 'تنبيه مباشر 🔴',
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [broadcastNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        broadcastNotification,
        broadcastNewOfferNotification,
        broadcastNewStoreNotification,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
