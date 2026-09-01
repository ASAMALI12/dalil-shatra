import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TopQuickNav } from './components/TopQuickNav';
import { HeroAdBanner } from './components/HeroAdBanner';
import { SearchBar } from './components/SearchBar';
import { CategoriesSection } from './components/CategoriesSection';
import { OffersSection } from './components/OffersSection';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { CategoryListModal } from './components/CategoryListModal';
import { AdvertiseModal } from './components/AdvertiseModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NewsModal } from './components/NewsModal';
import { OffersView } from './components/OffersView';
import { AccountView } from './components/AccountView';
import { ManagerDashboardModal } from './components/ManagerDashboardModal';
import { OpenStoreModal } from './components/OpenStoreModal';
import { ClaimStoreModal } from './components/ClaimStoreModal';
import { EditStoreModal } from './components/EditStoreModal';
import { ReportStoreModal } from './components/ReportStoreModal';
import { WalletModal } from './components/WalletModal';
import { NotificationToastBanner } from './components/NotificationToastBanner';
import { WalletProvider, useWallet } from './context/WalletContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { DirectoryProvider, useDirectory } from './context/DirectoryContext';
import { DirectoryItem, Offer, NotificationItem } from './types/shatrah';
import { Star, MapPin, ShieldCheck, Lock, Unlock, Store, MessageCircle, Wallet, ArrowRight } from 'lucide-react';

function ShatrahDirectoryApp() {
  const { isManagerUnlocked, balance } = useWallet();
  const { unreadCount } = useNotification();
  const { items } = useDirectory();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [tabHistory, setTabHistory] = useState<NavTab[]>(['home']);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; title: string } | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isOpenStoreModalOpen, setIsOpenStoreModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isManagerDashboardOpen, setIsManagerDashboardOpen] = useState(false);
  
  // Store claiming, editing, and reporting modals
  const [claimStoreTarget, setClaimStoreTarget] = useState<DirectoryItem | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [editStoreTarget, setEditStoreTarget] = useState<DirectoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reportStoreTarget, setReportStoreTarget] = useState<DirectoryItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Tab change handler with history
  const handleSelectTab = useCallback((tab: NavTab) => {
    if (tab !== activeTab) {
      setTabHistory((prev) => [...prev, tab]);
      setActiveTab(tab);
      window.history.pushState({ tab }, '');
    }
  }, [activeTab]);

  // Main Unified Back Button Handler (زر العودة للقائمة السابقة)
  const handleGoBack = useCallback(() => {
    // 1. If any sub-modal is open, close it first
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

    // 2. If an item details modal is open, close it (returns to Category list or Search or Tab)
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }

    // 3. If a Category list is open, close it (returns to Home)
    if (selectedCategory) {
      setSelectedCategory(null);
      return;
    }

    // 4. If searching, clear the search query (returns to clean Home)
    if (searchQuery.trim()) {
      setSearchQuery('');
      return;
    }

    // 5. If we have tab history, go back to previous tab
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // remove current tab
      const previousTab = newHistory[newHistory.length - 1] || 'home';
      setTabHistory(newHistory);
      setActiveTab(previousTab);
      return;
    }

    // 6. Default fallback: Return to 'home'
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTabHistory(['home']);
      return;
    }
  }, [
    isEditModalOpen,
    isClaimModalOpen,
    isWalletModalOpen,
    isManagerDashboardOpen,
    isAdModalOpen,
    isOpenStoreModalOpen,
    isNotificationsOpen,
    isNewsOpen,
    selectedItem,
    selectedCategory,
    searchQuery,
    tabHistory,
    activeTab,
  ]);

  // Sync with browser / mobile hardware back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      handleGoBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleGoBack]);

  // Live search filtering across dynamic items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.subCategory?.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery, items]);

  const handleSelectOffer = (offer: Offer) => {
    window.history.pushState({ offer: offer.id }, '');
    const found = items.find((i) => i.name.includes(offer.businessName) || offer.businessName.includes(i.name));
    if (found) {
      setSelectedItem(found);
    } else {
      setSelectedItem({
        id: offer.id,
        name: offer.businessName,
        category: offer.category,
        subCategory: offer.title,
        phone: offer.phone || '07801234567',
        whatsapp: '9647801234567',
        address: 'مدينة الشطرة - السوق التجاري',
        rating: 4.9,
        reviewsCount: 88,
        isOpen: true,
        workingHours: '9:00 ص - 10:00 م',
        imageUrl: offer.imageUrl,
        description: `${offer.description} (عرض خاص: ${offer.discountPercentage})`,
        tags: ['عرض خاص', 'تخفيضات الشطرة'],
      });
    }
  };

  const handleOpenNotificationTarget = (notif: NotificationItem) => {
    setIsNotificationsOpen(false);
    if (notif.type === 'offer' || notif.targetType === 'offer') {
      handleSelectTab('offers');
    } else if (notif.type === 'store' || notif.targetType === 'store') {
      window.history.pushState({ notif: notif.id }, '');
      const match = items.find(
        (i) => (notif.targetId && i.id === notif.targetId) || notif.title.includes(i.name)
      );
      if (match) {
        setSelectedItem(match);
      } else {
        setSelectedItem({
          id: notif.id,
          name: notif.title.replace('🎉 متجر جديد في الشطرة: ', '').replace('🛍️ متجر جديد: ', ''),
          category: 'المحلات والمتاجر',
          subCategory: 'متجر مسجل حديثاً',
          phone: '07801234567',
          whatsapp: '9647801234567',
          address: 'مدينة الشطرة - السوق التجاري',
          rating: 5.0,
          reviewsCount: 1,
          isOpen: true,
          workingHours: '8:00 ص - 11:00 م',
          imageUrl: notif.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
          description: notif.message,
          tags: ['متجر جديد', 'دليل الشطرة'],
        });
      }
    } else if (notif.type === 'news' || notif.targetType === 'news') {
      window.history.pushState({ news: true }, '');
      setIsNewsOpen(true);
    }
  };

  const isNonRootScreen = activeTab !== 'home' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20 selection:bg-red-100">
      {/* Real-time automatic broadcast alert banner */}
      <NotificationToastBanner onOpenTarget={handleOpenNotificationTarget} />

      {/* Centered Mobile/Web Container */}
      <div className="mx-auto max-w-xl bg-slate-50 min-h-screen shadow-lg border-x border-slate-200/80">
        
        {/* Main Header (Wallet is completely hidden from non-managers) */}
        <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-slate-200/60 space-y-2.5">
          {/* Top Bar with Brand, Open Store Button & Discreet Admin Access */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-600 text-white font-display text-sm font-bold shadow-xs">
                ش
              </span>
              <div>
                <h1 className="font-display text-sm font-bold text-slate-900 leading-tight">
                  دليل الشطرة الذكي
                </h1>
                <span className="text-[10px] text-slate-400 font-medium">سوق وأطباء وخدمات الشطرة</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick "Open Store" CTA for normal users */}
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({ modal: 'openStore' }, '');
                  setIsOpenStoreModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-2xl bg-emerald-50 border border-emerald-300/80 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              >
                <Store className="h-3.5 w-3.5 text-emerald-600" />
                <span>أضف متجرك</span>
              </button>

              {/* Discreet Manager Access Button (Phone+Username+Password protected) */}
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({ modal: 'manager' }, '');
                  setIsManagerDashboardOpen(true);
                }}
                className={`flex items-center gap-1 rounded-2xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isManagerUnlocked
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200'
                }`}
                title="لوحة تحكم المدير"
              >
                {isManagerUnlocked ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    <span className="text-[11px]">المدير ⚡</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-semibold">الإدارة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dedicated Back Button Ribbon when navigating away from Home root */}
          {isNonRootScreen && (
            <div className="flex items-center justify-between bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border border-red-200/90 px-3 py-2 rounded-2xl shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 bg-white border border-red-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <ArrowRight className="h-4 w-4 text-red-600" />
                <span>العودة للقائمة السابقة</span>
              </button>

              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[170px]">
                {searchQuery.trim()
                  ? `البحث: ${searchQuery}`
                  : activeTab === 'offers'
                  ? '🏷️ عروض وتخفيضات الشطرة'
                  : activeTab === 'account'
                  ? '👤 حسابي وإدارة المتاجر'
                  : activeTab === 'advertise'
                  ? '📢 حجز إعلان تجاري'
                  : ''}
              </span>
            </div>
          )}

          {/* Top 3 Action Pills: الإشعارات, عروض الشطرة, أخبار الشطرة */}
          <TopQuickNav
            onOpenNotifications={() => {
              window.history.pushState({ modal: 'notifs' }, '');
              setIsNotificationsOpen(true);
            }}
            onOpenOffers={() => handleSelectTab('offers')}
            onOpenNews={() => {
              window.history.pushState({ modal: 'news' }, '');
              setIsNewsOpen(true);
            }}
            unreadCount={unreadCount}
          />
        </header>

        {/* Tab-based Main Content */}
        <main className="p-4 space-y-5">
          {/* TAB 1: HOME (الرئيسية) */}
          {activeTab === 'home' && (
            <>
              {/* 1. Grand Red Advertisement Banner */}
              <HeroAdBanner
                onOpenAdModal={() => {
                  window.history.pushState({ modal: 'ad' }, '');
                  setIsAdModalOpen(true);
                }}
              />

              {/* 2. Quick Store Registration Bar for Visitors */}
              <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white flex-shrink-0 shadow-xs">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-xs font-bold text-emerald-950 truncate">
                        هل تملك محلاً أو نشاطاً في الشطرة؟
                      </span>
                      <span className="rounded-md bg-emerald-200/70 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2">
                        مجاناً
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 truncate">
                      سجل بدون حساب مع تأكيد الاسم ورقم الهاتف بالواتساب
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({ modal: 'openStore' }, '');
                    setIsOpenStoreModalOpen(true);
                  }}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 font-display text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  فتح متجر 💬
                </button>
              </div>

              {/* 3. Main Search Bar */}
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />

              {/* If user is actively searching, display search results */}
              {searchQuery.trim() ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-slate-700">
                      نتائج البحث عن "{searchQuery}" ({searchResults.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      إلغاء البحث
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                <span>{item.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{item.subCategory}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <MapPin className="h-3 w-3 text-red-500" />
                              <span className="truncate">{item.address}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white p-8 text-center text-slate-400 border border-slate-200">
                        <p className="text-3xl mb-1">🔍</p>
                        <p className="font-bold text-xs text-slate-600">لا توجد نتائج مطابقة</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* 4. Categories Section (3 Top Big Cards + 5 Bottom Subcards) */}
                  <CategoriesSection
                    onSelectCategory={(id, title) => {
                      window.history.pushState({ modal: 'category', id }, '');
                      setSelectedCategory({ id, title });
                    }}
                  />

                  {/* 5. Offers & Discounts Section (3 Horizontal Cards) */}
                  <OffersSection
                    onSelectOffer={handleSelectOffer}
                    onViewAllOffers={() => handleSelectTab('offers')}
                  />
                </>
              )}
            </>
          )}

          {/* TAB 2: OFFERS (العروض) */}
          {activeTab === 'offers' && (
            <OffersView onSelectOffer={handleSelectOffer} />
          )}

          {/* TAB 3: ACCOUNT (حسابي) */}
          {activeTab === 'account' && (
            <AccountView
              onOpenAdModal={() => {
                window.history.pushState({ modal: 'ad' }, '');
                setIsAdModalOpen(true);
              }}
              onOpenManagerDashboard={() => {
                window.history.pushState({ modal: 'manager' }, '');
                setIsManagerDashboardOpen(true);
              }}
              onOpenOpenStoreModal={() => {
                window.history.pushState({ modal: 'openStore' }, '');
                setIsOpenStoreModalOpen(true);
              }}
              onOpenWalletModal={() => {
                window.history.pushState({ modal: 'wallet' }, '');
                setIsWalletModalOpen(true);
              }}
              onOpenNotifications={() => {
                window.history.pushState({ modal: 'notifs' }, '');
                setIsNotificationsOpen(true);
              }}
              onOpenClaimStore={(store) => {
                window.history.pushState({ modal: 'claim' }, '');
                setClaimStoreTarget(store || null);
                setIsClaimModalOpen(true);
              }}
              onOpenEditStore={(store) => {
                window.history.pushState({ modal: 'edit' }, '');
                setEditStoreTarget(store);
                setIsEditModalOpen(true);
              }}
              onPreviewStore={(store) => {
                window.history.pushState({ modal: 'item', id: store.id }, '');
                setSelectedItem(store);
              }}
            />
          )}

          {/* TAB 4: ADVERTISE (إعلان) */}
          {activeTab === 'advertise' && (
            <div className="space-y-4">
              <HeroAdBanner
                onOpenAdModal={() => {
                  window.history.pushState({ modal: 'ad' }, '');
                  setIsAdModalOpen(true);
                }}
              />
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center space-y-4">
                <span className="text-4xl">📢</span>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  هل تريد إطلاق إعلانك الآن؟
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  اختر الباقة المناسبة لنشاطك التجاري، وادفع بسهولة عبر زين كاش أو ماستر كارد أو كي كارد وسينتشر إعلانك لجميع أهالي الشطرة فوراً مع إشعار تلقائي لجميع الهواتف!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState({ modal: 'ad' }, '');
                      setIsAdModalOpen(true);
                    }}
                    className="rounded-2xl bg-red-600 px-6 py-3 font-display text-sm font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                  >
                    حجز إعلان تجاري مميز
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState({ modal: 'openStore' }, '');
                      setIsOpenStoreModalOpen(true);
                    }}
                    className="rounded-2xl bg-emerald-600 px-6 py-3 font-display text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                  >
                    فتح متجر جديد مجاناً 💬
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onOpenAdModal={() => {
            window.history.pushState({ modal: 'ad' }, '');
            setIsAdModalOpen(true);
          }}
          onOpenWalletModal={() => {
            window.history.pushState({ modal: 'wallet' }, '');
            setIsWalletModalOpen(true);
          }}
        />
      </div>

      {/* Category List Modal (When clicking "عرض الكل") */}
      {selectedCategory && (
        <CategoryListModal
          categoryId={selectedCategory.id}
          categoryTitle={selectedCategory.title}
          onClose={() => setSelectedCategory(null)}
          onSelectItem={(item) => {
            window.history.pushState({ modal: 'item', id: item.id }, '');
            setSelectedItem(item);
          }}
        />
      )}

      {/* Advertise Submission Flow Modal */}
      <AdvertiseModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
      />

      {/* NEW: Store Creation Modal with WhatsApp Verification */}
      <OpenStoreModal
        isOpen={isOpenStoreModalOpen}
        onClose={() => setIsOpenStoreModalOpen(false)}
        onStoreCreated={(store) => {
          window.history.pushState({ modal: 'item', id: store.id }, '');
          setSelectedItem(store);
        }}
      />

      {/* Wallet Modal (Only opened by Manager) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Notifications Drawer/Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectNotification={handleOpenNotificationTarget}
      />

      {/* Shatrah News Modal */}
      <NewsModal
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
      />

      {/* MANAGER CONTROL DASHBOARD (Protected by Phone+Username+Password) */}
      <ManagerDashboardModal
        isOpen={isManagerDashboardOpen}
        onClose={() => setIsManagerDashboardOpen(false)}
        onPreviewStore={(store) => {
          setIsManagerDashboardOpen(false);
          window.history.pushState({ modal: 'item', id: store.id }, '');
          setSelectedItem(store);
        }}
        onOpenWalletModal={() => {
          setIsManagerDashboardOpen(false);
          window.history.pushState({ modal: 'wallet' }, '');
          setIsWalletModalOpen(true);
        }}
      />

      {/* Item Details Modal (Main Store View on Top) */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaimStore={(store) => {
            window.history.pushState({ modal: 'claim' }, '');
            setClaimStoreTarget(store);
            setIsClaimModalOpen(true);
          }}
          onEditStore={(store) => {
            window.history.pushState({ modal: 'edit' }, '');
            setEditStoreTarget(store);
            setIsEditModalOpen(true);
          }}
          onReportStore={(store) => {
            window.history.pushState({ modal: 'report' }, '');
            setReportStoreTarget(store);
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* Visitor Store Issue Reporting & Admin Contact Modal */}
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
          window.history.pushState({ modal: 'item', id: claimedStore.id }, '');
          setSelectedItem(claimedStore);
        }}
      />

      {/* Verified Store Owner Management / Edit Modal */}
      {editStoreTarget && (
        <EditStoreModal
          isOpen={isEditModalOpen}
          store={editStoreTarget}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditStoreTarget(null);
          }}
          onUpdated={(updatedStore) => {
            window.history.pushState({ modal: 'item', id: updatedStore.id }, '');
            setSelectedItem(updatedStore);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <DirectoryProvider>
      <WalletProvider>
        <NotificationProvider>
          <ShatrahDirectoryApp />
        </NotificationProvider>
      </WalletProvider>
    </DirectoryProvider>
  );
}
