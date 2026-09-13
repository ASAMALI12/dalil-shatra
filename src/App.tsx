import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { IraqGovernoratesGrid } from './components/IraqGovernoratesGrid';
import { DistrictsCircularView } from './components/DistrictsCircularView';
import { StoresCircularView } from './components/StoresCircularView';
import { AppSidebarDrawer } from './components/AppSidebarDrawer';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { AdvertiseModal } from './components/AdvertiseModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NewsModal } from './components/NewsModal';
import { OffersView } from './components/OffersView';
import { ManagerDashboardModal } from './components/ManagerDashboardModal';
import { OpenStoreModal } from './components/OpenStoreModal';
import { ClaimStoreModal } from './components/ClaimStoreModal';
import { EditStoreModal } from './components/EditStoreModal';
import { ReportStoreModal } from './components/ReportStoreModal';
import { WalletModal } from './components/WalletModal';
import { NotificationToastBanner } from './components/NotificationToastBanner';
import { SimpleAnimatedAdBanner } from './components/SimpleAnimatedAdBanner';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { LocationProvider, useLocation } from './context/LocationContext';
import { WalletProvider, useWallet } from './context/WalletContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { DirectoryProvider, useDirectory } from './context/DirectoryContext';
import { CategoryAdsProvider } from './context/CategoryAdsContext';
import { DirectoryItem, Offer, NotificationItem } from './types/shatrah';
import { IRAQ_GOVERNORATES, getGovernorate } from './data/iraqLocations';
import {
  Bell,
  Newspaper,
  Navigation,
  Menu,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ArrowRight,
  Home,
  MapPin,
  Send,
} from 'lucide-react';

export type NavLevel = 'governorates' | 'districts' | 'stores';

function IraqDirectoryApp() {
  const { isManagerUnlocked, balance } = useWallet();
  const { unreadCount } = useNotification();
  const { items } = useDirectory();
  const {
    currentLocation,
    isLocationModalOpen,
    openLocationModal,
    closeLocationModal,
    detectGPSLocation,
    isDetectingGPS,
    gpsStatusMessage,
    clearGpsStatusMessage,
    changeLocation,
  } = useLocation();

  // Navigation Level: 'governorates' (Image 1) | 'districts' (Image 2) | 'stores' (Image 2)
  const [navLevel, setNavLevel] = useState<NavLevel>('governorates');
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string>(
    currentLocation.governorateId || 'baghdad'
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    currentLocation.districtId || 'all'
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(
    currentLocation.districtName || 'الكل'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Sidebar Drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isOpenStoreModalOpen, setIsOpenStoreModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isManagerDashboardOpen, setIsManagerDashboardOpen] = useState(false);

  // Hidden 5-click trigger for manager login on the "دليل العراق" title
  const managerTapTimerRef = useRef<any>(null);
  const [managerTapCount, setManagerTapCount] = useState(0);

  const handleTitleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (managerTapTimerRef.current) {
      clearTimeout(managerTapTimerRef.current);
    }

    const nextCount = managerTapCount + 1;
    if (nextCount >= 5) {
      setManagerTapCount(0);
      setIsManagerDashboardOpen(true);
    } else {
      setManagerTapCount(nextCount);
      managerTapTimerRef.current = setTimeout(() => {
        setManagerTapCount(0);
      }, 2500);
    }
  };

  // Store action modals
  const [claimStoreTarget, setClaimStoreTarget] = useState<DirectoryItem | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [editStoreTarget, setEditStoreTarget] = useState<DirectoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reportStoreTarget, setReportStoreTarget] = useState<DirectoryItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active Governorate object
  const activeGovernorate = useMemo(() => {
    return getGovernorate(selectedGovernorateId) || IRAQ_GOVERNORATES[0];
  }, [selectedGovernorateId]);

  // Sync state if currentLocation updates from modal or GPS
  useEffect(() => {
    if (currentLocation.governorateId) {
      setSelectedGovernorateId(currentLocation.governorateId);
    }
    if (currentLocation.districtId) {
      setSelectedDistrictId(currentLocation.districtId);
      setSelectedDistrictName(currentLocation.districtName || 'الكل');
    }
  }, [currentLocation.governorateId, currentLocation.districtId, currentLocation.districtName]);

  // Notifications in top header are ONLY shown on the main governorates page (الواجهة الرئيسية للمحافظات)
  // Inside governorates, districts/regions, or stores, it is removed from the top bar.
  const showTopBarNotifications = activeTab === 'home' && navLevel === 'governorates';

  // Dynamic header context based on current page/view:
  // 1. First page (الصفحة الأولى): "دليل العراق 🇮🇶" & "أخبار العراق 🟡"
  // 2. Governorate page (صفحة المحافظة): "دليل [المحافظة] 📍" & "أخبار [المحافظة] 🟡"
  // 3. District page (صفحة القضاء أو الناحية): "دليل [القضاء/الناحية] 📍" & "أخبار [القضاء/الناحية] 🟡"
  const headerContext = useMemo(() => {
    // Level 3: Inside a district / stores view (صفحة القضاء أو الناحية)
    if (
      activeTab === 'home' &&
      navLevel === 'stores' &&
      selectedDistrictName &&
      selectedDistrictName !== 'الكل'
    ) {
      const distTitle = selectedDistrictName.trim();
      return {
        level: 'district' as const,
        title: `دليل ${distTitle}`,
        flagOrIcon: '📍',
        newsButtonText: `أخبار ${distTitle}`,
        governorateId: selectedGovernorateId,
        districtName: distTitle,
        newsMode: 'district' as const,
      };
    }

    // Level 2: Inside a governorate / districts view (صفحة المحافظة)
    if (
      (activeTab === 'home' && navLevel === 'districts') ||
      activeTab === 'districts'
    ) {
      const govName = activeGovernorate?.name || 'المحافظة';
      return {
        level: 'governorate' as const,
        title: `دليل ${govName}`,
        flagOrIcon: '📍',
        newsButtonText: `أخبار ${govName}`,
        governorateId: selectedGovernorateId,
        districtName: undefined,
        newsMode: 'city' as const,
      };
    }

    // Level 1: First page / All Iraq (الصفحة الأولى: عموم العراق)
    return {
      level: 'iraq' as const,
      title: 'دليل العراق',
      flagOrIcon: '🇮🇶',
      newsButtonText: 'أخبار العراق',
      governorateId: undefined,
      districtName: undefined,
      newsMode: 'all' as const,
    };
  }, [activeTab, navLevel, activeGovernorate, selectedGovernorateId, selectedDistrictName]);

  // Handle Tab Switch
  const handleSelectTab = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setNavLevel('governorates');
    } else if (tab === 'districts') {
      setNavLevel('districts');
    }
  }, []);

  // When clicking a Governorate from the 3-column grid (Image 1)
  const handleSelectGovernorate = (govId: string) => {
    setSelectedCategoryId(null);
    setSelectedGovernorateId(govId);
    changeLocation(govId, 'all');
    setNavLevel('districts');
    window.history.pushState({ level: 'districts', govId }, '');
  };

  // When clicking a District from the circular view (Image 2)
  const handleSelectDistrict = (distId: string, distName: string) => {
    setSelectedCategoryId(null);
    setSelectedDistrictId(distId);
    setSelectedDistrictName(distName);
    changeLocation(selectedGovernorateId, distId);
    setNavLevel('stores');
    window.history.pushState({ level: 'stores', govId: selectedGovernorateId, distId }, '');
  };

  // Back navigation handler
  const handleGoBack = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
      return;
    }
    if (isLocationModalOpen) {
      closeLocationModal();
      return;
    }
    if (isReportModalOpen) {
      setIsReportModalOpen(false);
      setReportStoreTarget(null);
      return;
    }
    if (isEditModalOpen) {
      setIsEditModalOpen(false);
      setEditStoreTarget(null);
      return;
    }
    if (isClaimModalOpen) {
      setIsClaimModalOpen(false);
      setClaimStoreTarget(null);
      return;
    }
    if (isWalletModalOpen) {
      setIsWalletModalOpen(false);
      return;
    }
    if (isManagerDashboardOpen) {
      setIsManagerDashboardOpen(false);
      return;
    }
    if (isAdModalOpen) {
      setIsAdModalOpen(false);
      return;
    }
    if (isOpenStoreModalOpen) {
      setIsOpenStoreModalOpen(false);
      return;
    }
    if (isNotificationsOpen) {
      setIsNotificationsOpen(false);
      return;
    }
    if (isNewsOpen) {
      setIsNewsOpen(false);
      return;
    }
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }

    // Step hierarchy: inside category -> categories circular view -> districts -> governorates
    if (activeTab === 'home') {
      if (navLevel === 'stores') {
        if (selectedCategoryId) {
          setSelectedCategoryId(null);
          return;
        }
        setNavLevel('districts');
        return;
      }
      if (navLevel === 'districts') {
        setNavLevel('governorates');
        return;
      }
    } else {
      setActiveTab('home');
      setNavLevel('governorates');
      setSelectedCategoryId(null);
      return;
    }
  }, [
    isSidebarOpen,
    isLocationModalOpen,
    closeLocationModal,
    isReportModalOpen,
    isEditModalOpen,
    isClaimModalOpen,
    isWalletModalOpen,
    isManagerDashboardOpen,
    isAdModalOpen,
    isOpenStoreModalOpen,
    isNotificationsOpen,
    isNewsOpen,
    selectedItem,
    activeTab,
    navLevel,
    selectedCategoryId,
  ]);

  // Return to All Governorates (Home)
  const handleGoHome = () => {
    setSelectedCategoryId(null);
    setNavLevel('governorates');
    setActiveTab('home');
  };

  // Listen to browser popstate (back button)
  useEffect(() => {
    const handlePopState = () => {
      handleGoBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleGoBack]);

  // Auto-detect GPS on initial app entry and send user directly to their city
  useEffect(() => {
    const hasRedirected = sessionStorage.getItem('iraq_app_gps_auto_redirected');
    if (!hasRedirected) {
      sessionStorage.setItem('iraq_app_gps_auto_redirected', 'true');
      detectGPSLocation(false, (loc) => {
        setSelectedGovernorateId(loc.governorateId);
        setSelectedDistrictId(loc.districtId);
        setSelectedDistrictName(loc.districtName);
        setNavLevel('stores');
        setActiveTab('home');
      });
    }
  }, [detectGPSLocation]);

  // Deep linking: open shared store directly if ?storeId=... is in the URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('storeId');
      if (storeId && items.length > 0) {
        const found = items.find((i) => i.id === storeId);
        if (found) {
          setSelectedItem(found);
          if (found.governorateId) {
            setSelectedGovernorateId(found.governorateId);
            if (found.districtId) {
              setSelectedDistrictId(found.districtId);
              setSelectedDistrictName(found.districtName || 'الكل');
            }
          }
        }
      }
    } catch (e) {}
  }, [items]);

  const canGoBack = Boolean(
    selectedCategoryId !== null ||
    navLevel !== 'governorates' ||
    activeTab !== 'home' ||
    selectedItem !== null ||
    isLocationModalOpen ||
    isReportModalOpen ||
    isEditModalOpen ||
    isClaimModalOpen ||
    isWalletModalOpen ||
    isManagerDashboardOpen ||
    isAdModalOpen ||
    isOpenStoreModalOpen ||
    isNotificationsOpen ||
    isNewsOpen
  );

  // Offers selection bridge
  const handleSelectOffer = (offer: Offer) => {
    const matchingStore = items.find((i) => i.name === offer.businessName);
    if (matchingStore) {
      setSelectedItem(matchingStore);
    } else {
      setSelectedItem({
        id: `offer-${offer.id}`,
        name: offer.businessName,
        category: offer.category || 'عروض وتخفيضات',
        subCategory: offer.title,
        phone: offer.phone || '07801552399',
        whatsapp: (offer as any).whatsapp || (offer.phone ? `964${offer.phone.replace(/^0/, '')}` : '9647801552399'),
        address: `${currentLocation.governorateName} - ${currentLocation.districtName}`,
        rating: 4.9,
        reviewsCount: 88,
        isOpen: true,
        workingHours: '09:00 ص - 11:00 م',
        imageUrl: offer.imageUrl,
        description: `${offer.description} (عرض خاص: ${offer.discountPercentage})`,
        tags: ['عرض خاص', `عروض ${currentLocation.governorateName}`],
      });
    }
  };

  // Notification click bridge
  const handleOpenNotificationTarget = (notif: NotificationItem) => {
    setIsNotificationsOpen(false);
    const targetId = notif.storeId || notif.targetId;
    if (targetId) {
      const found = items.find(
        (i) => i.id === targetId || (notif.title && i.name && notif.title.includes(i.name))
      );
      if (found) {
        setSelectedItem(found);
        return;
      }
    }
    // If notification has store-like or offer-like details, open ItemDetailsModal directly!
    if (
      notif.type === 'offer' ||
      notif.type === 'store' ||
      notif.targetType === 'store' ||
      notif.targetType === 'offer' ||
      notif.imageUrl
    ) {
      setSelectedItem({
        id: notif.storeId || notif.targetId || notif.id,
        name: notif.title
          .replace(/^[🔥🎉🍕🐟📍⭐📢🍽️🏨🛍️🍲☕🥩📱\s]+/, '')
          .replace(/^عرض خاص:\s*/, '')
          .replace(/^افتتاح فرع:\s*/, '')
          .replace(/^تنزيلات كبرى:\s*/, '')
          .replace(/^بوفيه مفتوح:\s*/, '')
          .replace(/^عروض الضيافة:\s*/, '')
          .replace(/^مهرجان التسوق:\s*/, '')
          .replace(/^مطبخ الموصل التراثي:\s*/, ''),
        category: notif.categoryName || notif.categoryId || 'المحلات والأنشطة',
        subCategory: notif.badge || 'عرض مميز',
        phone: (notif as any).phone || '07700000000',
        whatsapp: (notif as any).whatsapp,
        address: notif.districtName
          ? `${notif.governorateName || 'العراق'} - ${notif.districtName}`
          : notif.governorateName || 'العراق',
        rating: 5.0,
        reviewsCount: 1,
        isOpen: true,
        workingHours: '09:00 ص - 11:00 م',
        imageUrl:
          notif.imageUrl ||
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        description: notif.message,
        tags: [notif.badge || 'إشعار خاص', notif.districtName || notif.governorateName || 'العراق'].filter(
          Boolean
        ),
        isClaimed: true,
        claimStatus: 'verified',
      });
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20 selection:bg-sky-100">
      {/* Real-time automatic broadcast alert banner */}
      <NotificationToastBanner onOpenTarget={handleOpenNotificationTarget} />

      <div className="mx-auto max-w-md bg-slate-50 min-h-screen shadow-lg border-x border-slate-200/80">
        
        {/* Top Header matching Screenshot 1 (Curved Sky-Blue Header with Title & Icons) */}
        <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md px-3 sm:px-4 pt-3 pb-2.5 border-b border-slate-200/60 space-y-2">
          {/* Sky-Blue Brand Header Container matching Screenshot 1 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 px-3 py-2 text-white shadow-xs">
            <div className="flex items-center justify-between">
              {/* Left Side: Dynamic Pill Button matching screenshot */}
              <button
                type="button"
                onClick={() => {
                  try {
                    window.history.pushState({ modal: 'news' }, '');
                  } catch (e) {}
                  setIsNewsOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs border border-white/20 max-w-[130px] sm:max-w-[160px]"
                title={`${headerContext.newsButtonText} من المصادر الرسمية`}
              >
                <span className="truncate">{headerContext.newsButtonText}</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
              </button>

              {/* Center: Title "دليل العراق" / "دليل المحافظة" / "دليل القضاء" (5 clicks triggers manager login) */}
              <div
                onClick={handleTitleClick}
                className="flex items-center gap-1.5 select-none cursor-pointer active:scale-95 transition-transform max-w-[150px] sm:max-w-[200px]"
                title={headerContext.title}
              >
                <h1 className="font-display text-base sm:text-lg font-black tracking-wide drop-shadow-xs truncate">
                  {headerContext.title}
                </h1>
                <span className="text-sm shrink-0">{headerContext.flagOrIcon}</span>
              </div>

              {/* Right Side: Notifications Bell (only on main governorates page) & Location/Telegram Button */}
              <div className="flex items-center gap-1.5">
                {/* 1. Notifications Icon with Badge - ONLY in the main governorates page for Iraq-wide ads and manager broadcasts */}
                {showTopBarNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.history.pushState({ modal: 'notifications' }, '');
                      } catch (e) {}
                      setIsNotificationsOpen(true);
                    }}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="إعلانات العراق وإشعارات الإدارة العامة"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-xs">
                      {unreadCount > 0 ? unreadCount : 4}
                    </span>
                  </button>
                )}

                {/* 2. Paper Plane / Telegram Channel Button matching screenshot */}
                <button
                  type="button"
                  onClick={() => {
                    detectGPSLocation(true, (loc) => {
                      setSelectedGovernorateId(loc.governorateId);
                      setSelectedDistrictId(loc.districtId);
                      setSelectedDistrictName(loc.districtName);
                      setSelectedCategoryId(null);
                      setNavLevel('stores');
                      setActiveTab('home');
                    });
                  }}
                  disabled={isDetectingGPS}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer active:scale-95 disabled:opacity-60 shadow-2xs"
                  title="تحديد موقعي التلقائي أو فتح القناة"
                >
                  {isDetectingGPS ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 -rotate-45" />
                  )}
                </button>

                {/* 3. Manager Access Button - ONLY shown when authenticated */}
                {isManagerUnlocked && (
                  <button
                    type="button"
                    onClick={() => setIsManagerDashboardOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 bg-amber-400 text-slate-950 shadow-xs font-bold ring-2 ring-amber-300/60"
                    title="لوحة الإدارة (مفتوحة)"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GPS Status Message Toast */}
          {gpsStatusMessage && (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl text-[11px] font-semibold text-sky-900 animate-in fade-in shadow-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span>🛰️</span>
                <span className="truncate">{gpsStatusMessage}</span>
              </div>
              <div className="flex items-center gap-2 mr-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="rounded-lg bg-sky-200/80 px-2 py-1 text-[10px] font-bold text-sky-900 hover:bg-sky-300 transition-colors cursor-pointer"
                >
                  اختر يدوياً 📍
                </button>
                <button
                  type="button"
                  onClick={clearGpsStatusMessage}
                  className="text-[11px] text-sky-700 font-bold hover:underline cursor-pointer"
                  title="إغلاق"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="p-3 sm:p-4 space-y-3.5">
          {/* TAB 1: HOME (الرئيسية) */}
          {activeTab === 'home' && (
            <>
              {/* LEVEL 1: ALL GOVERNORATES GRID matching Screenshot 1 */}
              {navLevel === 'governorates' && (
                <div className="space-y-3.5">
                  {/* المربع الأزرق البسيط الأنيق المطابق للصورة مع أضواء وانيميشن متحرك جذاب للمعلن */}
                  <SimpleAnimatedAdBanner
                    onOpenClaimStoreModal={(store) => setClaimStoreTarget(store)}
                  />

                  {/* شبكة المحافظات المطابقة للصورة */}
                  <IraqGovernoratesGrid
                    onSelectGovernorate={handleSelectGovernorate}
                  />
                </div>
              )}

              {/* LEVEL 2: CIRCULAR DISTRICTS VIEW matching Screenshot 2 */}
              {navLevel === 'districts' && (
                <DistrictsCircularView
                  governorate={activeGovernorate}
                  onSelectDistrict={handleSelectDistrict}
                  onOpenClaimStoreModal={(store) => setClaimStoreTarget(store)}
                />
              )}

              {/* LEVEL 3: CIRCULAR CATEGORIES & STORES LIST matching Screenshot 2 */}
              {navLevel === 'stores' && (
                <StoresCircularView
                  governorateId={selectedGovernorateId}
                  governorateName={activeGovernorate.name}
                  districtId={selectedDistrictId}
                  districtName={selectedDistrictName}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={(catId) => {
                    if (catId) {
                      try {
                        window.history.pushState({ screen: 'category', catId }, '');
                      } catch (e) {}
                    }
                    setSelectedCategoryId(catId);
                  }}
                  onBack={() => {
                    setSelectedCategoryId(null);
                    setNavLevel('districts');
                  }}
                  onHome={handleGoHome}
                  onSelectItem={(item) => {
                    window.history.pushState({ modal: 'item', id: item.id }, '');
                    setSelectedItem(item);
                  }}
                  onClaimStore={(store) => {
                    window.history.pushState({ modal: 'claim' }, '');
                    setClaimStoreTarget(store);
                    setIsClaimModalOpen(true);
                  }}
                  onOpenStoreModal={() => {
                    window.history.pushState({ modal: 'openStore' }, '');
                    setIsOpenStoreModalOpen(true);
                  }}
                />
              )}
            </>
          )}

          {/* TAB 2: DISTRICTS / EXPLORER (المناطق) */}
          {activeTab === 'districts' && (
            <DistrictsCircularView
              governorate={activeGovernorate}
              onBack={() => {
                setActiveTab('home');
                setNavLevel('governorates');
              }}
              onHome={handleGoHome}
              onSelectDistrict={(distId, distName) => {
                setSelectedDistrictId(distId);
                setSelectedDistrictName(distName);
                setActiveTab('home');
                setNavLevel('stores');
              }}
            />
          )}

          {/* TAB 3: OFFERS (العروض) */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-2.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  🏷️ عروض وتخفيضات {activeGovernorate.name}
                </h2>
                <div className="w-9" />
              </div>
              <OffersView onSelectOffer={handleSelectOffer} />
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar with mini icons matching Screenshot 1 */}
        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onOpenAdModal={() => setIsAdModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
        />
      </div>

      {/* Sidebar Drawer Component */}
      <AppSidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenAdModal={() => setIsAdModalOpen(true)}
        onOpenStoreModal={() => setIsOpenStoreModalOpen(true)}
        onOpenManagerDashboard={() => setIsManagerDashboardOpen(true)}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onDetectGPS={() => {
          setIsSidebarOpen(false);
          detectGPSLocation(true, (loc) => {
            setSelectedGovernorateId(loc.governorateId);
            setSelectedDistrictId(loc.districtId);
            setSelectedDistrictName(loc.districtName);
            setSelectedCategoryId(null);
            setNavLevel('stores');
            setActiveTab('home');
          });
        }}
      />

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={closeLocationModal}
        onSelectLocation={(govId, distId, distName) => {
          setSelectedGovernorateId(govId);
          setSelectedDistrictId(distId);
          setSelectedDistrictName(distName);
          setSelectedCategoryId(null);
          setNavLevel('stores');
          setActiveTab('home');
        }}
      />

      {/* Advertise Modal */}
      <AdvertiseModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
      />

      {/* Open Store Modal */}
      <OpenStoreModal
        isOpen={isOpenStoreModalOpen}
        onClose={() => setIsOpenStoreModalOpen(false)}
        onStoreCreated={(store) => {
          setSelectedItem(store);
        }}
      />

      {/* Wallet Modal (Only opened by Manager) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Notifications Drawer/Modal - Dedicated to all-Iraq announcements, ads, and manager broadcasts */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectNotification={handleOpenNotificationTarget}
        initialScope="all"
      />

      {/* Regional News Modal */}
      <NewsModal
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        initialGovernorateId={headerContext.governorateId}
        initialDistrictName={headerContext.districtName}
        initialFilterMode={headerContext.newsMode}
      />

      {/* Manager Control Dashboard */}
      <ManagerDashboardModal
        isOpen={isManagerDashboardOpen}
        onClose={() => setIsManagerDashboardOpen(false)}
        onPreviewStore={(store) => {
          setIsManagerDashboardOpen(false);
          setSelectedItem(store);
        }}
        onOpenWalletModal={() => {
          setIsManagerDashboardOpen(false);
          setIsWalletModalOpen(true);
        }}
      />

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={handleGoBack}
          onClaimStore={(store) => {
            setClaimStoreTarget(store);
            setIsClaimModalOpen(true);
          }}
          onEditStore={(store) => {
            setEditStoreTarget(store);
            setIsEditModalOpen(true);
          }}
          onReportStore={(store) => {
            setReportStoreTarget(store);
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* Report Store Modal */}
      <ReportStoreModal
        isOpen={isReportModalOpen}
        item={reportStoreTarget}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportStoreTarget(null);
        }}
      />

      {/* Claim Store Verification Modal */}
      <ClaimStoreModal
        isOpen={isClaimModalOpen}
        storeToClaim={claimStoreTarget}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimStoreTarget(null);
        }}
        onClaimSuccess={(claimedStore) => {
          setSelectedItem(claimedStore);
        }}
      />

      {/* Edit Store Modal */}
      {editStoreTarget && (
        <EditStoreModal
          isOpen={isEditModalOpen}
          store={editStoreTarget}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditStoreTarget(null);
          }}
          onUpdated={(updatedStore) => {
            setSelectedItem(updatedStore);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LocationProvider>
      <DirectoryProvider>
        <WalletProvider>
          <NotificationProvider>
            <CategoryAdsProvider>
              <IraqDirectoryApp />
            </CategoryAdsProvider>
          </NotificationProvider>
        </WalletProvider>
      </DirectoryProvider>
    </LocationProvider>
  );
}
