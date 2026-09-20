import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem, Offer, DirectoryItem } from '../types/directory';
import { doesCategoryMatch, normalizeCategoryId } from '../utils/categoryMatcher';
import { apiFetch } from '../utils/apiClient';

export interface IraqMainAnnouncement {
  id: string;
  title: string;
  message: string;
  badge?: string;
  contactNumber?: string;
  updatedAt: number;
  author: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  activeToast: NotificationItem | null;
  mainAnnouncement: IraqMainAnnouncement;
  updateMainAnnouncement: (announcement: Partial<IraqMainAnnouncement>) => void;
  dismissToast: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
  broadcastNotification: (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  broadcastNewOfferNotification: (offer: Partial<Offer>) => void;
  broadcastNewStoreNotification: (store: Partial<DirectoryItem>) => void;
  getNotificationsForCategory: (governorateId?: string, districtId?: string, categoryId?: string) => NotificationItem[];
  getUnreadCountForCategory: (governorateId?: string, districtId?: string, categoryId?: string) => number;
  getNotificationsForLocation: (governorateId?: string, districtId?: string) => NotificationItem[];
  markCategoryAsRead: (governorateId?: string, districtId?: string, categoryId?: string) => void;
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

const getUserSavedLocation = (): { governorateId?: string; districtId?: string } | null => {
  try {
    const saved = localStorage.getItem('iraq_directory_location');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return null;
};

export function isNotificationInLocation(
  notif: NotificationItem,
  govId?: string,
  distId?: string
): boolean {
  // If notification is nationwide / all Iraq, it applies everywhere
  if (
    notif.targetScope === 'iraq' ||
    notif.governorateId === 'all' ||
    (!notif.governorateId && !notif.districtId)
  ) {
    return true;
  }

  // Governorate check
  if (govId && govId !== 'all') {
    if (notif.governorateId && notif.governorateId !== 'all' && notif.governorateId !== govId) {
      return false;
    }
  }

  // District check
  if (distId && distId !== 'all') {
    if (notif.districtId && notif.districtId !== 'all' && notif.districtId !== distId) {
      return false;
    }
  }

  return true;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // بغداد - الكرخ
  {
    id: 'notif-bg-1',
    title: '🍕 عرض خاص: مطعم الصالحية الإيطالي - الكرخ',
    message: 'خصم 20% على البيتزا والباستا لزبائن دليل العراق في قضاء الكرخ مع توصيل سريع.',
    time: 'منذ نصف ساعة',
    timestamp: Date.now() - 1000 * 60 * 30,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'bg-karkh-pizza-1',
    storeId: 'bg-karkh-pizza-1',
    badge: 'خصم 20% 🔥',
    targetScope: 'district',
    targetGovernorateId: 'baghdad',
    targetDistrictId: 'karkh',
    governorateId: 'baghdad',
    governorateName: 'بغداد',
    districtId: 'karkh',
    districtName: 'الكرخ',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  // بغداد - الرصافة
  {
    id: 'notif-bg-2',
    title: '📱 افتتاح فرع: مركز بغداد للإلكترونيات - الرصافة',
    message: 'عروض حصرية على أجهزة الهواتف الذكية وضمان سنة كاملة مع هدايا قيمة لكل زبون.',
    time: 'منذ ساعة',
    timestamp: Date.now() - 1000 * 60 * 60,
    type: 'store',
    unread: true,
    targetType: 'store',
    targetId: 'bg-rusafa-tech-1',
    storeId: 'bg-rusafa-tech-1',
    badge: 'افتتاح جديد ✨',
    targetScope: 'district',
    targetGovernorateId: 'baghdad',
    targetDistrictId: 'rusafa',
    governorateId: 'baghdad',
    governorateName: 'بغداد',
    districtId: 'rusafa',
    districtName: 'الرصافة',
    categoryId: 'electronics',
    categoryName: 'الإلكترونيات والموبايل',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  // البصرة - مركز البصرة
  {
    id: 'notif-bs-1',
    title: '🐟 خصم الأسماك والمأكولات البحرية - البصرة',
    message: 'سمك مسكوف طازج وربيان شط العرب مع توصيل مجاني وسريع في مركز البصرة.',
    time: 'منذ ساعة',
    timestamp: Date.now() - 1000 * 60 * 65,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'bs-center-fish-1',
    storeId: 'bs-center-fish-1',
    badge: 'توصيل مجاني 🛵',
    targetScope: 'district',
    targetGovernorateId: 'basra',
    targetDistrictId: 'basra-center',
    governorateId: 'basra',
    governorateName: 'البصرة',
    districtId: 'basra-center',
    districtName: 'مركز البصرة',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  // البصرة - العشار
  {
    id: 'notif-bs-rest-1',
    title: '🐟 عرض مميز: مطعم عروس البصرة للمأكولات البحرية - العشار',
    message: 'سمك مسكوف طازج ومأكولات بحرية فاخرة مع تخفيض 20% للعائلات هذا الأسبوع.',
    time: 'منذ 3 ساعات',
    timestamp: Date.now() - 1000 * 60 * 180,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'bs-ashar-rest-1',
    storeId: 'bs-ashar-rest-1',
    badge: 'عرض حصري ⭐',
    targetScope: 'district',
    targetGovernorateId: 'basra',
    targetDistrictId: 'ashar',
    governorateId: 'basra',
    governorateName: 'البصرة',
    districtId: 'ashar',
    districtName: 'العشار',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  // ذي قار - الشطرة
  {
    id: 'notif-shatrah-food-1',
    title: '🔥 عرض خاص: مطعم ومشويات الشطرة الملكي',
    message: 'كباب عراقي بلدي، دجاج فحم، وقوزي مع خدمة توصيل مجانية وسريعة لكافة أحياء الشطرة. خصم 20% لزبائن الدليل!',
    time: 'منذ ساعتين',
    timestamp: Date.now() - 1000 * 60 * 120,
    type: 'offer',
    unread: true,
    targetType: 'offer',
    targetId: 'cad-shatrah-rest-1',
    storeId: 'cad-shatrah-rest-1',
    badge: 'خصم 20% 🔥',
    targetScope: 'district',
    targetGovernorateId: 'dhi-qar',
    targetDistrictId: 'shatrah',
    governorateId: 'dhi-qar',
    governorateName: 'ذي قار',
    districtId: 'shatrah',
    districtName: 'الشطرة',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  // ذي قار - الناصرية
  {
    id: 'notif-dhi-qar-nasiriyah-1',
    title: '🏬 تنزيلات كبرى: مجمع الزيتون التجاري - الناصرية',
    message: 'تخفيضات تصل إلى 30% على الملابس والعطور ومستحضرات التجميل بمناسبة الموسم الجديد.',
    time: 'منذ 3 ساعات',
    timestamp: Date.now() - 1000 * 60 * 170,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'dhi-qar-nasiriyah-shop-1',
    storeId: 'dhi-qar-nasiriyah-shop-1',
    badge: 'تخفيض 30% 🎉',
    targetScope: 'district',
    targetGovernorateId: 'dhi-qar',
    targetDistrictId: 'nasiriyah',
    governorateId: 'dhi-qar',
    governorateName: 'ذي قار',
    districtId: 'nasiriyah',
    districtName: 'الناصرية',
    categoryId: 'shopping',
    categoryName: 'التسوق والمتاجر',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 170).toISOString(),
  },
  // النجف الأشرف
  {
    id: 'notif-najaf-1',
    title: '🍽️ بوفيه مفتوح: مطاعم الروضة السياحية - النجف الأشرف',
    message: 'تشكيلة من أشهى المأكولات الشرقية والعراقية بأسعار خاصة للعوائل والزائرين.',
    time: 'منذ ساعتين',
    timestamp: Date.now() - 1000 * 60 * 130,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'najaf-rawda-rest-1',
    storeId: 'najaf-rawda-rest-1',
    badge: 'بوفيه عائلي 🌟',
    targetScope: 'governorate',
    targetGovernorateId: 'najaf',
    governorateId: 'najaf',
    governorateName: 'النجف الأشرف',
    districtId: 'najaf-center',
    districtName: 'مركز النجف',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  // كربلاء المقدسة
  {
    id: 'notif-karbala-1',
    title: '🏨 عروض الضيافة: فندق وريزيدنس جنة الفردوس - كربلاء',
    message: 'حجوزات مميزة وقريبة من العتبات المقدسة مع خدمة نقل وإفطار صباحي مجاني.',
    time: 'منذ ساعتين',
    timestamp: Date.now() - 1000 * 60 * 140,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'karbala-hotel-1',
    storeId: 'karbala-hotel-1',
    badge: 'عرض الضيافة 🏨',
    targetScope: 'governorate',
    targetGovernorateId: 'karbala',
    governorateId: 'karbala',
    governorateName: 'كربلاء المقدسة',
    districtId: 'karbala-center',
    districtName: 'مركز كربلاء',
    categoryId: 'services',
    categoryName: 'الخدمات العامة',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  // أربيل
  {
    id: 'notif-erbil-1',
    title: '🛍️ مهرجان التسوق: سيتي سنتر أربيل',
    message: 'تخفيضات موسمية كبرى في أكثر من 50 متجراً وماركة عالمية مع سحوبات على جوائز فورية.',
    time: 'منذ ساعة ونصف',
    timestamp: Date.now() - 1000 * 60 * 90,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'erbil-mall-1',
    storeId: 'erbil-mall-1',
    badge: 'مهرجان التسوق 🎁',
    targetScope: 'governorate',
    targetGovernorateId: 'erbil',
    governorateId: 'erbil',
    governorateName: 'أربيل',
    districtId: 'erbil-center',
    districtName: 'مركز أربيل',
    categoryId: 'shopping',
    categoryName: 'التسوق والمتاجر',
    imageUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  // نينوى - الموصل
  {
    id: 'notif-nineveh-1',
    title: '🍲 مطبخ الموصل التراثي: عروق ودولمة وكبب موصلية',
    message: 'أطيب الأكلات الموصلية الأصيلة طازجة يومياً مع خدمة توصيل للجانبين الأيمن والأيسر.',
    time: 'منذ ساعتين',
    timestamp: Date.now() - 1000 * 60 * 150,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'nineveh-food-1',
    storeId: 'nineveh-food-1',
    badge: 'تراث موصلي 🏺',
    targetScope: 'governorate',
    targetGovernorateId: 'nineveh',
    governorateId: 'nineveh',
    governorateName: 'نينوى',
    districtId: 'mosul-left',
    districtName: 'الموصل - الجانب الأيسر',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
  // بابل - الحلة
  {
    id: 'notif-babylon-1',
    title: '☕ مقهى ومطعم بابل السياحي - الحلة',
    message: 'جلسات عائلية هادئة وإطلالة مميزة مع خصم 15% على الوجبات الخفيفة والمشروبات.',
    time: 'منذ 3 ساعات',
    timestamp: Date.now() - 1000 * 60 * 190,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'babylon-cafe-1',
    storeId: 'babylon-cafe-1',
    badge: 'خصم 15% ☕',
    targetScope: 'governorate',
    targetGovernorateId: 'babylon',
    governorateId: 'babylon',
    governorateName: 'بابل',
    districtId: 'hilla-center',
    districtName: 'مركز الحلة',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
  },
  // كركوك
  {
    id: 'notif-kirkuk-1',
    title: '🥩 كباب ومطعم القلعة الشهير - كركوك',
    message: 'كباب كركوكي على أصوله مع مقبلات وشاي عراقي مجاناً لجميع الطلبات العائلية.',
    time: 'منذ 3 ساعات',
    timestamp: Date.now() - 1000 * 60 * 200,
    type: 'offer',
    unread: true,
    targetType: 'store',
    targetId: 'kirkuk-kebab-1',
    storeId: 'kirkuk-kebab-1',
    badge: 'كباب كركوكي 🍢',
    targetScope: 'governorate',
    targetGovernorateId: 'kirkuk',
    governorateId: 'kirkuk',
    governorateName: 'كركوك',
    districtId: 'kirkuk-center',
    districtName: 'مركز كركوك',
    categoryId: 'restaurants',
    categoryName: 'المطاعم والمأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
  // إشعار العراق العام
  {
    id: 'notif-system-gps',
    title: '📍 ميزة الكشف التلقائي للموقع (GPS)',
    message: 'يمكنك بضغطة واحدة كشف محافظتك وقضائك تلقائياً لترتيب الإعلانات والأنشطة التجارية الأقرب إليك.',
    time: 'منذ 4 ساعات',
    timestamp: Date.now() - 1000 * 60 * 240,
    type: 'system',
    unread: false,
    targetScope: 'iraq',
    badge: 'خدمة ذكية ⚡',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

function deduplicateNotifications(list: NotificationItem[]): NotificationItem[] {
  const seenIds = new Set<string>();
  const sanitized: NotificationItem[] = [];

  for (const item of list) {
    if (!item || !item.id) continue;
    // Notifications are strictly for the application: exclude any external news articles
    if (item.type === 'news' || item.targetType === 'news' || String(item.id).startsWith('live-notif-')) {
      continue;
    }
    const cleanId = String(item.id).trim();
    if (seenIds.has(cleanId)) continue;

    seenIds.add(cleanId);
    sanitized.push(item);
  }

  return sanitized;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('iraq_notifications_list_v2') || localStorage.getItem('shatrah_notifications_list_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_NOTIFICATIONS so all governorates have active alerts
          const combined = [...parsed];
          for (const init of INITIAL_NOTIFICATIONS) {
            if (!combined.some((c) => c.id === init.id)) {
              combined.push(init);
            }
          }
          return deduplicateNotifications(combined);
        }
      } catch (e) {}
    }
    return deduplicateNotifications(INITIAL_NOTIFICATIONS);
  });

  const DEFAULT_MAIN_ANNOUNCEMENT: IraqMainAnnouncement = {
    id: 'main-iraq-announcement-1',
    title: '🇮🇶 إشعار العراق العام • تنبيه الإدارة المركزية',
    message: 'مرحباً بكم في منصة دليل العراق الشامل. هذا الإشعار الرسمي العام يصل لجميع مستخدمي التطبيق في كافة محافظات العراق بدون استثناء.',
    badge: 'إشعار العراق ككل 🇮🇶',
    updatedAt: Date.now(),
    author: 'إدارة دليل العراق',
  };

  const [mainAnnouncement, setMainAnnouncement] = useState<IraqMainAnnouncement>(() => {
    try {
      const saved = localStorage.getItem('iraq_main_blue_announcement');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MAIN_ANNOUNCEMENT;
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('iraq_notif_sound') || localStorage.getItem('shatrah_notif_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('iraq_main_blue_announcement', JSON.stringify(mainAnnouncement));
  }, [mainAnnouncement]);

  const updateMainAnnouncement = useCallback((data: Partial<IraqMainAnnouncement>) => {
    setMainAnnouncement((prev) => {
      const updated: IraqMainAnnouncement = {
        ...prev,
        ...data,
        updatedAt: Date.now(),
      };
      localStorage.setItem('iraq_main_blue_announcement', JSON.stringify(updated));
      return updated;
    });

    // Also trigger chime
    playNotificationSound();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('iraq_notifications_list_v2', JSON.stringify(deduplicateNotifications(notifications)));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('iraq_notif_sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Location-aware relevance check
  const isNotificationRelevantToUser = useCallback(
    (n: NotificationItem, userLoc: { governorateId?: string; districtId?: string } | null): boolean => {
      // 1. National broadcast
      const scope = n.targetScope || (n.targetDistrictId || (n.districtId && n.districtId !== 'all') ? 'district' : (n.targetGovernorateId || (n.governorateId && n.governorateId !== 'all') ? 'governorate' : 'iraq'));
      if (scope === 'iraq') return true;

      if (!userLoc) return true;

      // 2. Governorate scope
      if (scope === 'governorate') {
        const targetGov = n.targetGovernorateId || n.governorateId;
        return Boolean(targetGov && userLoc.governorateId && targetGov === userLoc.governorateId);
      }

      // 3. District scope
      if (scope === 'district') {
        const targetDist = n.targetDistrictId || n.districtId;
        const targetGov = n.targetGovernorateId || n.governorateId;
        if (userLoc.districtId && userLoc.districtId !== 'all') {
          return targetDist === userLoc.districtId;
        }
        return Boolean(targetGov && userLoc.governorateId && targetGov === userLoc.governorateId);
      }

      return true;
    },
    []
  );

  // Sync from server API on mount
  useEffect(() => {
    const userLoc = getUserSavedLocation();
    const query = userLoc?.governorateId
      ? `?governorateId=${encodeURIComponent(userLoc.governorateId)}&districtId=${encodeURIComponent(userLoc.districtId || 'all')}`
      : '';

    apiFetch(`/api/notifications${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newServerItems = data.notifications
              .filter((sn: any) => !existingIds.has(sn.id))
              .map((sn: any) => ({
                ...sn,
                time: 'مؤخراً',
                unread: true,
              }));
            if (newServerItems.length === 0) return prev;
            return deduplicateNotifications([...newServerItems, ...prev]);
          });
        }
      })
      .catch(() => {
        // Offline or server not yet loaded
      });
  }, []);

  const unreadCount = notifications.filter((n) => {
    if (!n.unread) return false;
    const userLoc = getUserSavedLocation();
    return isNotificationRelevantToUser(n, userLoc);
  }).length;

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

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const broadcastNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
      const scope = item.targetScope || (item.targetDistrictId || (item.districtId && item.districtId !== 'all') ? 'district' : (item.targetGovernorateId || (item.governorateId && item.governorateId !== 'all') ? 'governorate' : 'iraq'));

      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: 'الآن',
        timestamp: Date.now(),
        unread: true,
        targetScope: scope,
        targetGovernorateId: item.targetGovernorateId || item.governorateId,
        targetDistrictId: item.targetDistrictId || item.districtId,
        createdAt: item.createdAt || new Date().toISOString(),
        categoryId: item.categoryId ? normalizeCategoryId(item.categoryId) : undefined,
      };

      // Add to local state
      setNotifications((prev) => [newNotif, ...prev]);

      // Server-side broadcast API call
      try {
        apiFetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNotif),
        }).catch(() => {});
      } catch (e) {}

      // GEOGRAPHIC FILTERING FOR USER'S ACTIVE SCREEN:
      const userLoc = getUserSavedLocation();
      const matchesUserLocation = isNotificationRelevantToUser(newNotif, userLoc);

      // Only show banner toast & chime if the user is in the targeted district/area
      if (matchesUserLocation) {
        setActiveToast(newNotif);

        if (soundEnabled) {
          playNotificationSound();
        }

        setTimeout(() => {
          setActiveToast((current) => (current?.id === newNotif.id ? null : current));
        }, 5000);
      }
    },
    [soundEnabled, isNotificationRelevantToUser]
  );

  // Broadcast helper when a new offer is posted (defaults to district scope)
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
        targetScope: 'district',
        targetGovernorateId: offer.governorateId,
        targetDistrictId: offer.districtId,
        governorateId: offer.governorateId,
        districtId: offer.districtId,
        categoryId: offer.category ? normalizeCategoryId(offer.category) : undefined,
        createdAt: new Date().toISOString(),
      });
    },
    [broadcastNotification]
  );

  // Broadcast helper when a new store / place is added to directory (defaults to district scope)
  const broadcastNewStoreNotification = useCallback(
    (store: Partial<DirectoryItem>) => {
      broadcastNotification({
        title: `🎉 متجر جديد: ${store.name || 'نشاط تجاري جديد'}`,
        message: `تم إضافة ${store.name || 'متجر جديد'} إلى قسم (${store.category || 'المحلات'}) في ${store.address || 'العراق'} - تصفح التفاصيل وتواصل مباشرة.`,
        type: 'store',
        targetType: 'store',
        targetId: store.id,
        storeId: store.id,
        imageUrl: store.imageUrl,
        badge: 'متجر جديد',
        targetScope: 'district',
        targetGovernorateId: store.governorateId,
        targetDistrictId: store.districtId,
        governorateId: store.governorateId,
        governorateName: store.governorateName,
        districtId: store.districtId,
        districtName: store.districtName,
        categoryId: store.category ? normalizeCategoryId(store.category) : undefined,
        createdAt: new Date().toISOString(),
      });
    },
    [broadcastNotification]
  );

  // Retrieve notifications targeted to a specific category and location
  const getNotificationsForCategory = useCallback(
    (govId?: string, distId?: string, catId?: string) => {
      return notifications.filter((notif) => {
        // 1. Location match
        if (!isNotificationInLocation(notif, govId, distId)) {
          return false;
        }

        // 2. Category match (if specific category is requested)
        if (catId && catId !== 'all') {
          const normalizedCat = normalizeCategoryId(catId);
          if (!notif.categoryId || !doesCategoryMatch(normalizedCat, notif.categoryId)) {
            return false;
          }
        }

        return true;
      });
    },
    [notifications]
  );

  // Unread count for a specific category in a district
  const getUnreadCountForCategory = useCallback(
    (govId?: string, distId?: string, catId?: string) => {
      return getNotificationsForCategory(govId, distId, catId).filter((n) => n.unread).length;
    },
    [getNotificationsForCategory]
  );

  // Retrieve notifications for a specific district/governorate
  const getNotificationsForLocation = useCallback(
    (govId?: string, distId?: string) => {
      return notifications.filter((notif) => isNotificationInLocation(notif, govId, distId));
    },
    [notifications]
  );

  // Mark all notifications for a specific category in a district as read
  const markCategoryAsRead = useCallback(
    (govId?: string, distId?: string, catId?: string) => {
      setNotifications((prev) =>
        prev.map((n) => {
          if (!isNotificationInLocation(n, govId, distId)) {
            return n;
          }
          if (catId && catId !== 'all') {
            const normalizedCat = normalizeCategoryId(catId);
            if (!n.categoryId || !doesCategoryMatch(normalizedCat, n.categoryId)) {
              return n;
            }
          }
          return { ...n, unread: false };
        })
      );
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        mainAnnouncement,
        updateMainAnnouncement,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        deleteNotification,
        broadcastNotification,
        addNotification: broadcastNotification,
        broadcastNewOfferNotification,
        broadcastNewStoreNotification,
        getNotificationsForCategory,
        getUnreadCountForCategory,
        getNotificationsForLocation,
        markCategoryAsRead,
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

