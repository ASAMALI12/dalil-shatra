import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Globe,
  ShieldCheck,
  Radio,
  Inbox,
  RotateCw,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { CityNews } from '../types/shatrah';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';
import { useLocation } from '../context/LocationContext';
import { fetchLiveCityNews } from '../services/clientNewsService';
import { matchesDistrict, matchesGovernorate } from '../services/liveIraqNewsService';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGovernorateId?: string;
  initialDistrictName?: string;
  initialFilterMode?: 'district' | 'city' | 'all';
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  initialGovernorateId,
  initialDistrictName,
  initialFilterMode,
}) => {
  const { currentLocation } = useLocation();
  const [selectedGovId, setSelectedGovId] = useState<string>(
    initialGovernorateId || currentLocation.governorateId || 'dhi-qar'
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(
    initialDistrictName && initialDistrictName !== 'الكل' ? initialDistrictName : ''
  );
  const [filterMode, setFilterMode] = useState<'district' | 'city' | 'all'>(
    initialFilterMode || (initialDistrictName && initialDistrictName !== 'الكل' ? 'district' : 'city')
  );
  const [newsList, setNewsList] = useState<CityNews[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('الآن');

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    newsList.forEach((n) => {
      if (n.source) set.add(n.source);
    });
    return Array.from(set);
  }, [newsList]);

  // Sync state when modal is opened with specific scope props
  useEffect(() => {
    if (isOpen) {
      if (initialGovernorateId) {
        setSelectedGovId(initialGovernorateId);
      } else if (currentLocation.governorateId) {
        setSelectedGovId(currentLocation.governorateId);
      }

      if (initialDistrictName && initialDistrictName !== 'الكل') {
        setSelectedDistrictName(initialDistrictName);
      } else if (initialDistrictName === '') {
        setSelectedDistrictName('');
      }

      if (initialFilterMode) {
        setFilterMode(initialFilterMode);
      } else if (initialDistrictName && initialDistrictName !== 'الكل') {
        setFilterMode('district');
      } else if (initialGovernorateId) {
        setFilterMode('city');
      }
    }
  }, [isOpen, initialGovernorateId, initialDistrictName, initialFilterMode, currentLocation.governorateId]);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const items = await fetchLiveCityNews({
        governorateId: filterMode === 'all' ? undefined : selectedGovId,
        districtName: filterMode === 'district' ? selectedDistrictName : undefined,
        filterMode,
        forceRefresh,
      });

      setNewsList(items);
      setLastUpdated(new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('News fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, selectedGovId, selectedDistrictName]);

  // Fetch when opened or when filterMode / governorate / district changes
  useEffect(() => {
    if (isOpen) {
      fetchNews(false);
    }
  }, [isOpen, fetchNews]);

  if (!isOpen) return null;

  const currentGov = IRAQ_GOVERNORATES.find((g) => g.id === selectedGovId) || IRAQ_GOVERNORATES[0];

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'بلدية وخدمات':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'اقتصاد وتجارة':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'أمن ومرور':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'صحة وبيئة':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ثقافة ورياضة':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  const filteredNews = newsList.filter((news) => {
    // Strict Scope check:
    if (filterMode === 'district' && selectedDistrictName) {
      if (!matchesDistrict(news, selectedDistrictName)) return false;
    } else if (filterMode === 'city' && selectedGovId && selectedGovId !== 'all') {
      if (!matchesGovernorate(news, selectedGovId)) return false;
    }

    // 1. Source filter
    if (selectedSource !== 'all' && news.source !== selectedSource) {
      return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (news.title?.toLowerCase().includes(q)) ?? false;
      const matchSummary = (news.summary?.toLowerCase().includes(q)) ?? false;
      const matchSource = (news.source?.toLowerCase().includes(q)) ?? false;
      const matchCategory = (news.category?.toLowerCase().includes(q)) ?? false;
      if (!matchTitle && !matchSummary && !matchSource && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[92vh] flex flex-col border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slim Top Bar without bulky titles */}
        <div className="border-b border-slate-200 p-2.5 sm:p-3 bg-slate-900 text-white flex items-center justify-between gap-2">
          {/* Main Scope Switchers */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {selectedDistrictName && (
              <button
                type="button"
                onClick={() => setFilterMode('district')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterMode === 'district'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>أخبار {selectedDistrictName}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterMode('city')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'city'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>أخبار {currentGov.name}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>عموم العراق</span>
            </button>
          </div>

          {/* Action buttons: Refresh + Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchNews(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-400/30 transition-all cursor-pointer text-xs font-bold active:scale-95 disabled:opacity-50"
              title="تحديث الأخبار الآن مباشرة من المصادر"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث الآن</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
              title="إغلاق"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Governorates horizontal quick selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap pl-1">
            اختر المدينة:
          </span>
          {IRAQ_GOVERNORATES.map((gov) => (
            <button
              key={gov.id}
              type="button"
              onClick={() => {
                setSelectedGovId(gov.id);
                setFilterMode('city');
              }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedGovId === gov.id && filterMode === 'city'
                  ? 'bg-sky-600 text-white font-extrabold shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {gov.name}
            </button>
          ))}
        </div>

        {/* Search & Status strip */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-100/70 border-b border-slate-200 text-xs">
          <div className="relative flex-1">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأخبار (مثال: مشاريع، أسعار، صحة، ماء...)"
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-sky-500 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 shrink-0">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>محدث ({lastUpdated})</span>
          </div>
        </div>

        {/* Trusted Sources Quick Filter */}
        {availableSources.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1 pl-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>المصدر:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedSource('all')}
              className={`flex-shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSource === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              جميع المصادر
            </button>
            {availableSources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedSource(src)}
                className={`flex-shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSource === src
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        )}

        {/* News Feed Items */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-3.5 flex-1 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <div className="h-7 w-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600">جاري جلب آخر الأخبار المحدثة فوراً...</span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Inbox className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد أخبار مطابقة لبحثك</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery ? 'جرّب كتابة كلمة بحث أخرى أو مسح البحث' : 'اضغط على زر تحديث الآن لجلب أحدث المستجدات'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchNews(true);
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer hover:bg-sky-700 transition-colors"
              >
                تحديث الأخبار الآن 🔄
              </button>
            </div>
          ) : (
            filteredNews.map((news, newsIndex) => (
              <article
                key={`${news.id || 'news'}-${newsIndex}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                {news.imageUrl && (
                  <div className="aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-sm">
                      <Radio className="h-3 w-3 text-red-400 animate-pulse" />
                      <span>{news.isUrgent ? 'عاجل • بث مباشر' : 'مباشر'}</span>
                    </div>

                    {news.category && (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className={`rounded-lg px-2.5 py-1 font-black text-[11px] border shadow-xs ${getCategoryBadgeColor(news.category)}`}>
                          {news.category}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3.5 sm:p-4 space-y-2.5">
                  {/* Meta Strip: Source & Exact Date */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {news.source && (
                        <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>المصدر: {news.source}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>{news.date}</span>
                    </div>
                  </div>

                  {/* News Title */}
                  <h4 className="font-display text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {news.title}
                  </h4>

                  {/* Summary / Body */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {news.summary}
                  </p>

                  {/* Read original link */}
                  {news.link && (
                    <div className="pt-1 flex items-center justify-end">
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200"
                      >
                        <span>قراءة الخبر من المصدر</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-2.5 sm:p-3 bg-slate-50 text-center flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            <span>أخبار حية ومحدثة من المصادر الرسمية العراقية</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
