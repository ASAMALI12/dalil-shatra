import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  Globe,
  MapPin,
  Store,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  AlertCircle,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useWallet } from '../context/WalletContext';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';
import { CIRCULAR_CATEGORIES } from './StoresCircularView';
import { CategoryAd } from '../types/shatrah';

export const ManagerAdsTab: React.FC = () => {
  const { ads, addCategoryAd, deleteCategoryAd, renewCategoryAd } = useCategoryAds();
  const { balance } = useWallet();

  // Filters
  const [scopeFilter, setScopeFilter] = useState<'all' | 'national' | 'governorate' | 'store_area'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Form State for Adding New Ad
  const [newScope, setNewScope] = useState<'national' | 'governorate' | 'store_area'>('national');
  const [selectedGovId, setSelectedGovId] = useState<string>('all');
  const [selectedDistId, setSelectedDistId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('restaurants');
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [offerBadge, setOfferBadge] = useState('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [price, setPrice] = useState<number>(30000);
  const [paymentMethod, setPaymentMethod] = useState('زين كاش (ZainCash)');

  // Selected Gov object
  const currentGovObj = useMemo(() => {
    return IRAQ_GOVERNORATES.find((g) => g.id === selectedGovId);
  }, [selectedGovId]);

  // Filtered Ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      // Scope filter
      if (scopeFilter === 'national') {
        if (ad.scope !== 'national' && ad.governorateId !== 'all') return false;
      } else if (scopeFilter === 'governorate') {
        if (ad.scope !== 'governorate' && (ad.scope || ad.districtId !== 'all')) return false;
      } else if (scopeFilter === 'store_area') {
        if (ad.scope && ad.scope !== 'store_area') return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = ad.businessName.toLowerCase().includes(q);
        const matchesHead = ad.headline.toLowerCase().includes(q);
        const matchesGov = ad.governorateName?.toLowerCase().includes(q);
        const matchesDist = ad.districtName?.toLowerCase().includes(q);
        const matchesRef = ad.referenceNumber?.toLowerCase().includes(q);
        const matchesPhone = ad.phone?.includes(q);
        if (!matchesName && !matchesHead && !matchesGov && !matchesDist && !matchesRef && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [ads, scopeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const now = Date.now();
    const active = ads.filter((a) => !a.expiresAt || a.expiresAt >= now);
    const national = active.filter((a) => a.scope === 'national' || a.governorateId === 'all').length;
    const gov = active.filter((a) => a.scope === 'governorate' || (!a.scope && a.districtId === 'all')).length;
    const store = active.filter((a) => a.scope === 'store_area' || (!a.scope && a.districtId !== 'all')).length;
    const totalRevenue = ads.reduce((sum, a) => sum + (a.price || 0), 0);

    return {
      total: ads.length,
      active: active.length,
      national,
      gov,
      store,
      totalRevenue,
    };
  }, [ads]);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !headline.trim()) {
      alert('يرجى كتابة اسم النشاط وعنوان الإعلان');
      return;
    }

    const govName =
      newScope === 'national'
        ? 'عموم العراق'
        : currentGovObj?.name || 'كافة المحافظات';

    const distObj = currentGovObj?.districts.find((d) => d.id === selectedDistId);
    const distName =
      newScope === 'national' || newScope === 'governorate'
        ? 'عموم المحافظة'
        : distObj?.name || 'كل الأقضية';

    const catObj = CIRCULAR_CATEGORIES.find((c) => c.id === selectedCategoryId);
    const catName = catObj?.title || 'عام';

    addCategoryAd({
      scope: newScope,
      governorateId: newScope === 'national' ? 'all' : selectedGovId,
      governorateName: govName,
      districtId: newScope === 'store_area' ? selectedDistId : 'all',
      districtName: distName,
      categoryId: selectedCategoryId,
      categoryName: catName,
      businessName: businessName.trim(),
      headline: headline.trim(),
      description: description.trim() || headline.trim(),
      phone: phone.trim() || '07800000000',
      whatsapp: whatsapp.trim() || phone.trim() || '07800000000',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      offerBadge: offerBadge.trim() || undefined,
      durationDays: Number(durationDays),
      price: Number(price),
      paymentMethod,
    });

    setActionSuccessMsg(`تم إنشاء ونشر إعلان (${businessName}) بنجاح!`);
    setTimeout(() => setActionSuccessMsg(''), 4000);

    // Reset Form
    setBusinessName('');
    setHeadline('');
    setDescription('');
    setPhone('');
    setWhatsapp('');
    setImageUrl('');
    setOfferBadge('');
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك بحذف إعلان "${name}" نهائياً من النظام؟`)) {
      deleteCategoryAd(id);
      setActionSuccessMsg(`تم حذف إعلان "${name}" بنجاح.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    }
  };

  const handleRenew = (id: string, name: string, days: number) => {
    renewCategoryAd(id, days);
    setActionSuccessMsg(`تم تمديد إعلان "${name}" لمدة ${days} يوم إضافية.`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const formatRemainingTime = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'منتهي الصلاحية';
    const hours = Math.floor(diff / (1000 * 3600));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (days > 0) return `${days} يوم و ${remHours} ساعة`;
    return `${hours} ساعة`;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 p-4 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>إدارة الإعلانات الممولة (الوطنية والمحلية والمتاجر)</span>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                تحكم المدير المركزي
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              إعلانات عموم العراق 🇮🇶 • إعلانات المحافظات • إعلانات أقسام المتاجر مع تدوير كل 15 ثانية
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-rose-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة إعلان ممول جديد</span>
        </button>
      </div>

      {/* Success Alert Banner */}
      {actionSuccessMsg && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/50 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي الإعلانات</span>
            <Megaphone className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-display text-lg sm:text-xl font-black text-white">
            {stats.total}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
            {stats.active} نشط حالياً
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إعلانات عموم العراق</span>
            <Globe className="h-4 w-4 text-sky-400" />
          </div>
          <div className="font-display text-lg sm:text-xl font-black text-white">
            {stats.national}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            تظهر لكافة زوار العراق
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إعلانات المحافظات</span>
            <MapPin className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="font-display text-lg sm:text-xl font-black text-white">
            {stats.gov}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            مخصصة لكل محافظة
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إعلانات المتاجر (15 ثانية)</span>
            <Store className="h-4 w-4 text-rose-400" />
          </div>
          <div className="font-display text-lg sm:text-xl font-black text-white">
            {stats.store}
          </div>
          <div className="text-[10px] text-rose-300 mt-0.5">
            تدوير تلقائي داخل الأقسام
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar gap-1 text-xs">
          {[
            { id: 'all', label: `الكل (${ads.length})` },
            { id: 'national', label: `🇮🇶 عموم العراق (${stats.national})` },
            { id: 'governorate', label: `🏛️ المحافظات (${stats.gov})` },
            { id: 'store_area', label: `🏪 المتاجر والأقسام (${stats.store})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScopeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                scopeFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم النشاط أو الرقم..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pr-9 pl-3 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-2">
          <Megaphone className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">لا توجد إعلانات مطابقة</p>
          <p className="text-xs text-slate-500">يمكنك إضافة إعلان جديد بصلاحيات المدير العام في أي وقت.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAds.map((ad, adIdx) => {
            const isExpired = ad.expiresAt && ad.expiresAt < Date.now();
            const scopeLabel =
              ad.scope === 'national' || ad.governorateId === 'all'
                ? 'إعلان وطني (عموم العراق) 🇮🇶'
                : ad.scope === 'governorate'
                ? `إعلان محافظة (${ad.governorateName})`
                : `إعلان متجر (${ad.districtName} - ${ad.categoryName})`;

            const scopeBadgeColor =
              ad.scope === 'national' || ad.governorateId === 'all'
                ? 'bg-sky-950 text-sky-300 border-sky-700'
                : ad.scope === 'governorate'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-rose-950 text-rose-300 border-rose-700';

            return (
              <div
                key={`${ad.id || 'mgr-ad'}-${adIdx}`}
                className={`rounded-2xl border p-4 transition-all ${
                  isExpired
                    ? 'bg-slate-950/60 border-slate-800 opacity-70'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-3 text-right">
                  {/* Image & Basic details */}
                  <div className="flex items-start gap-3.5 w-full md:w-auto">
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.businessName}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${scopeBadgeColor}`}>
                          {scopeLabel}
                        </span>
                        {ad.offerBadge && (
                          <span className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                            {ad.offerBadge}
                          </span>
                        )}
                        {isExpired ? (
                          <span className="rounded-lg bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 text-[10px] font-bold">
                            منتهي
                          </span>
                        ) : (
                          <span className="rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            نشط وفعال
                          </span>
                        )}
                      </div>

                      <h5 className="font-display text-sm font-bold text-white">
                        {ad.businessName}
                      </h5>

                      <p className="text-xs text-slate-300 line-clamp-2">
                        {ad.headline}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span dir="ltr">{ad.phone}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>المتبقي: {formatRemainingTime(ad.expiresAt)}</span>
                        </span>
                        <span className="font-mono text-slate-500">
                          كود: {ad.referenceNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing, Renewal & Delete Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="font-display text-xs sm:text-sm font-black text-amber-400">
                        {(ad.price || 0).toLocaleString('ar-IQ')} د.ع
                      </div>
                      <div className="text-[10px] text-slate-400">
                        المدة الكلية: {ad.durationDays} أيام
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Renewal options */}
                      <button
                        type="button"
                        onClick={() => handleRenew(ad.id, ad.businessName, 1)}
                        title="تمديد الإعلان +1 يوم"
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 text-[11px] font-bold transition-all cursor-pointer border border-slate-700"
                      >
                        +1 يوم
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRenew(ad.id, ad.businessName, 3)}
                        title="تمديد الإعلان +3 أيام"
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 text-[11px] font-bold transition-all cursor-pointer border border-slate-700"
                      >
                        +3 أيام
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(ad.id, ad.businessName)}
                        title="حذف الإعلان نهائياً"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 transition-all cursor-pointer border border-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW AD MODAL (بصلاحيات المدير) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-6 text-white max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm sm:text-base font-bold text-white">
                    إنشاء إعلان ممول بصلاحيات المدير
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    يمكنك تحديد النطاق (عراق عام، محافظة، أو متجر وقسم محدد)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="flex-1 overflow-y-auto py-4 space-y-3.5 text-right">
              {/* 1. Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نطاق ظهور الإعلان المميز *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewScope('national')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newScope === 'national'
                        ? 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-xs'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🇮🇶 عموم العراق
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('governorate')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newScope === 'governorate'
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-xs'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🏛️ محافظة محددة
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('store_area')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      newScope === 'store_area'
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300 shadow-xs'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🏪 متجر ومنطقة (15 ثانية)
                  </button>
                </div>
              </div>

              {/* Location Selectors if Governorate or Store Area */}
              {newScope !== 'national' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">المحافظة</label>
                    <select
                      value={selectedGovId}
                      onChange={(e) => {
                        setSelectedGovId(e.target.value);
                        setSelectedDistId('all');
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      {IRAQ_GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newScope === 'store_area' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">القضاء / المنطقة</label>
                      <select
                        value={selectedDistId}
                        onChange={(e) => setSelectedDistId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="all">كل الأقضية</option>
                        {currentGovObj?.districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">القسم التجاري</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {CIRCULAR_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر أو الشركة المعلنة *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="مثال: مطعم ومشويات الشطرة الملكي"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الإعلان الرئيسي *</label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="مثال: أشهى المأكولات مع توصيل مجاني وسريع"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0780xxxxxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0780xxxxxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Image URL & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رابط الصورة (Image URL)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شارة العرض (Offer Badge)</label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="مثال: خصم 20% 🔥"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المدة (أيام) *</label>
                  <select
                    value={durationDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      setDurationDays(days);
                      if (days === 7) setPrice(30000);
                      else if (days === 14) setPrice(55000);
                      else if (days === 5 || days === 30) setPrice(100000);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value={7}>أسبوع كامل (30,000 د.ع)</option>
                    <option value={14}>أسبوعان (55,000 د.ع)</option>
                    <option value={5}>5 أيام (100,000 د.ع)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">السعر (د.ع)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none text-left"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:from-amber-600 hover:to-red-700 transition-all cursor-pointer mt-2"
              >
                تأكيد ونشر الإعلان فوراً في النظام
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
