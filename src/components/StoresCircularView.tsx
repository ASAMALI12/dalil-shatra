import React, { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  CheckCircle2,
  Store,
  X,
  ShieldCheck,
  DollarSign,
  Tag,
  Briefcase,
  HelpCircle,
  Clock,
  Plus,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { AddCommunityPostModal } from './AddCommunityPostModal';
import { DistrictEmergencySection } from './DistrictEmergencySection';
import { StoreCategoryAnimatedAdBanner } from './StoreCategoryAnimatedAdBanner';
import { openExternalUrl, openSocialMediaLink } from '../utils/socialLinks';

interface StoresCircularViewProps {
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onBack: () => void;
  onHome: () => void;
  onSelectItem: (item: DirectoryItem) => void;
  onClaimStore: (store: DirectoryItem) => void;
  onOpenStoreModal: () => void;
}

export interface CircularCategory {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  colorClass: string;
  searchPlaceholder: string;
  addLabel: string;
  tagsMatch: string[];
}

export const CIRCULAR_CATEGORIES: CircularCategory[] = [
  {
    id: 'restaurants',
    title: 'المطاعم والمأكولات',
    shortTitle: 'المطاعم',
    icon: '🍽️',
    colorClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200',
    searchPlaceholder: 'بحث في المطاعم (وجبات، شاورما، مشويات، بيتزا، برغر)...',
    addLabel: '+ أضف مطعمك',
    tagsMatch: [
      'مطاعم',
      'مطعم',
      'مأكولات',
      'وجبات',
      'شاورما',
      'مشويات',
      'بيتزا',
      'برغر',
      'كباب',
      'مندي',
      'سمك',
      'فطور',
      'عروق',
      'قيمة',
      'دليمية',
      'لحم',
      'غداء',
      'عشاء',
    ],
  },
  {
    id: 'supermarkets',
    title: 'السوبر ماركت والمتاجر',
    shortTitle: 'المتاجر والأسواق',
    icon: '🛒',
    colorClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    searchPlaceholder: 'بحث في المتاجر والأسواق (الاسم، المواد، السلع)...',
    addLabel: '+ أضف متجرك',
    tagsMatch: [
      'سوبر ماركت',
      'سوبرماركت',
      'ماركت',
      'بقالة',
      'غذائية',
      'أسواق',
      'هايبر',
      'متجر',
      'متاجر',
      'تسوق',
      'أغذية',
      'تموينية',
      'لحوم',
    ],
  },
  {
    id: 'clothing',
    title: 'مجمعات الألبسة والأزياء',
    shortTitle: 'مجمعات الألبسة',
    icon: '🛍️',
    colorClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    searchPlaceholder: 'بحث في مجمعات الألبسة والأزياء والأحذية...',
    addLabel: '+ أضف مجمعك',
    tagsMatch: [
      'ألبسة',
      'ملابس',
      'مجمع',
      'أزياء',
      'أحذية',
      'حقائب',
      'بوتيك',
      'سنتر',
      'عباءات',
      'فساتين',
      'بدلات',
    ],
  },
  {
    id: 'electronics',
    title: 'محلات الموبايل والإلكترونيات',
    shortTitle: 'الموبايل والتقنية',
    icon: '📱',
    colorClass: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200',
    searchPlaceholder: 'بحث في محلات الموبايل والإلكترونيات والصيانة...',
    addLabel: '+ أضف محلك',
    tagsMatch: [
      'موبايل',
      'إلكترونيات',
      'هواتف',
      'صيانة',
      'كمبيوتر',
      'شاشات',
      'آبل',
      'سامسونج',
      'شاومي',
      'أجهزة',
      'لابتوب',
      'سماعات',
    ],
  },
  {
    id: 'cafes',
    title: 'الكافيهات والمقاهي',
    shortTitle: 'الكافيهات',
    icon: '☕',
    colorClass: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200',
    searchPlaceholder: 'بحث في الكافيهات والمقاهي والحلويات والعصائر...',
    addLabel: '+ أضف مقهاك',
    tagsMatch: [
      'كافيه',
      'مقهى',
      'كوفي',
      'عصائر',
      'حلويات',
      'شاي',
      'قهوة',
      'بن',
      'وافل',
      'كريب',
      'ايس كريم',
    ],
  },
  {
    id: 'medical',
    title: 'الأطباء والعيادات والصيدليات',
    shortTitle: 'الأطباء والصيدليات',
    icon: '🩺',
    colorClass: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
    searchPlaceholder: 'بحث في الأطباء والعيادات والصيدليات والمختبرات...',
    addLabel: '+ أضف عيادتك',
    tagsMatch: [
      'أطباء',
      'طبيب',
      'صيدلية',
      'صيدليات',
      'عيادة',
      'عيادات',
      'دكتور',
      'مستشفى',
      'مختبر',
      'أسنان',
      'عيون',
      'باطنية',
      'أطفال',
      'تحليلات',
    ],
  },
  {
    id: 'services',
    title: 'الخدمات والصيانة المنزلية',
    shortTitle: 'الخدمات والمهن',
    icon: '🔧',
    colorClass: 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200',
    searchPlaceholder: 'بحث في مراكز الصيانة والخدمات المنزلية والمهن...',
    addLabel: '+ أضف خدمتك',
    tagsMatch: [
      'خدمات',
      'صيانة',
      'تصليح',
      'ميكانيك',
      'سباكة',
      'كهرباء',
      'غسيل',
      'تنظيف',
      'تكييف',
      'حدادة',
      'نجارة',
    ],
  },
  {
    id: 'automotive',
    title: 'معارض والسيارات',
    shortTitle: 'معارض السيارات',
    icon: '🚗',
    colorClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
    searchPlaceholder: 'بحث في معارض السيارات وقطع الغيار والزيوت...',
    addLabel: '+ أضف معرضك',
    tagsMatch: [
      'سيارات',
      'معرض',
      'غسيل',
      'زيوت',
      'إطارات',
      'قطع غيار',
      'معارض',
      'بنشر',
      'فحص سيارات',
    ],
  },
  // SPECIAL USER-REQUESTED CATEGORIES:
  {
    id: 'used-goods',
    title: 'سوق المواد المستعملة',
    shortTitle: 'المواد المستعملة',
    icon: '♻️',
    colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-300',
    searchPlaceholder: 'بحث في المواد المستعملة (أجهزة، أثاث، هواتف، سيارات)...',
    addLabel: '+ أضف مادة مستعملة',
    tagsMatch: [
      'مستعمل',
      'مستعملة',
      'سوق المستعمل',
      'أغراض مستعملة',
      'أجهزة مستعملة',
      'أثاث مستعمل',
      'موبايل مستعمل',
      'بالة',
      'used_goods',
    ],
  },
  {
    id: 'lost-found',
    title: 'قسم المفقودات والموجودات',
    shortTitle: 'المفقودات',
    icon: '🔍',
    colorClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-300',
    searchPlaceholder: 'بحث في المفقودات (مستمسكات، مفاتيح، محفظة، هاتف، أمانات)...',
    addLabel: '+ أبلغ عن مفقود / موجود',
    tagsMatch: [
      'مفقودات',
      'مفقود',
      'موجودات',
      'معثور عليه',
      'أمانة',
      'مستمسكات',
      'محفظة',
      'ضائع',
      'lost_found',
    ],
  },
  {
    id: 'jobs',
    title: 'وظائف شاغرة وفرص عمل',
    shortTitle: 'وظائف وعمالة',
    icon: '💼',
    colorClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300',
    searchPlaceholder: 'بحث في الوظائف (مطلوب كاشير، كباب، مندوب، سائق، باحث عن عمل)...',
    addLabel: '+ أعلن عن وظيفة / طلب عامل',
    tagsMatch: [
      'وظائف',
      'وظيفة',
      'عمل',
      'عمال',
      'موظف',
      'عامل',
      'مطلوب',
      'خلفة',
      'كاشير',
      'مندوب',
      'سائق',
      'شاغر',
      'فرصة عمل',
      'job',
    ],
  },
];

export const StoresCircularView: React.FC<StoresCircularViewProps> = ({
  governorateId,
  governorateName,
  districtId,
  districtName,
  selectedCategoryId,
  onSelectCategory,
  onBack,
  onSelectItem,
  onClaimStore,
  onOpenStoreModal,
}) => {
  const { items } = useDirectory();
  const { getAdsForCategory } = useCategoryAds();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'employer' | 'seeker'>('all');

  // Community Modal State for Used Goods, Lost & Found, and Jobs
  const [communityModalType, setCommunityModalType] = useState<'used_goods' | 'lost_found' | 'job' | null>(null);

  // Find active category object if selected
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return CIRCULAR_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  // Retrieve VIP Rotating Ads for this specific category and district/governorate
  const activeCategoryAds = useMemo(() => {
    if (!activeCategory) return [];
    return getAdsForCategory(governorateId, districtId, activeCategory.id);
  }, [getAdsForCategory, governorateId, districtId, activeCategory]);

  // Check if an item matches a specific category
  const itemMatchesCategory = (item: DirectoryItem, cat: CircularCategory): boolean => {
    if (cat.id === 'used-goods') {
      return item.itemType === 'used_goods' || item.category === 'used-goods' || item.tags?.includes('مستعمل');
    }
    if (cat.id === 'lost-found') {
      return item.itemType === 'lost_found' || item.category === 'lost-found' || item.tags?.includes('مفقودات');
    }
    if (cat.id === 'jobs') {
      return item.itemType === 'job' || item.category === 'jobs' || item.tags?.includes('وظائف');
    }

    const itemCat = (item.category || '').toLowerCase().trim();
    const itemSub = (item.subCategory || '').toLowerCase().trim();
    const itemName = (item.name || '').toLowerCase().trim();

    // 1. Direct ID or slug match
    if (itemCat === cat.id || itemCat.includes(cat.id) || cat.id.includes(itemCat)) {
      return true;
    }

    // 2. English and Arabic category aliases match
    const categoryAliases: Record<string, string[]> = {
      supermarkets: ['grocery', 'market', 'supermarket', 'food', 'mart', 'بقالة', 'اسواق', 'أسواق', 'غذائية', 'سوبرماركت', 'سوبر ماركت', 'هايبر'],
      supermarket: ['grocery', 'market', 'supermarket', 'food', 'mart', 'بقالة', 'اسواق', 'أسواق', 'غذائية', 'سوبرماركت', 'سوبر ماركت', 'هايبر'],
      clothing: ['clothing', 'fashion', 'clothes', 'boutique', 'wear', 'dress', 'ملابس', 'أزياء', 'ازياء', 'ألبسة', 'البسة', 'بوتيك', 'أحذية', 'حقائب'],
      restaurants: ['restaurant', 'restaurants', 'food', 'dining', 'grill', 'pizza', 'burger', 'مطعم', 'مطاعم', 'وجبات', 'مشاوي', 'شاورما', 'كباب', 'قوزي', 'سمك'],
      cafes: ['cafe', 'cafes', 'coffee', 'espresso', 'كافيه', 'كوفي', 'مقهى', 'قهوة', 'شاي', 'عصائر', 'حلويات'],
      medical: ['doctor', 'doctors', 'clinic', 'medical', 'hospital', 'health', 'pharmacy', 'pharmacies', 'طبيب', 'دكتور', 'عيادة', 'صحة', 'مستشفى', 'عيادات', 'صيدلية', 'صيدليات', 'دواء', 'علاج'],
      doctors: ['doctor', 'doctors', 'clinic', 'medical', 'hospital', 'health', 'طبيب', 'دكتور', 'عيادة', 'صحة', 'مستشفى', 'عيادات'],
      pharmacies: ['pharmacy', 'pharmacies', 'medicine', 'drugstore', 'صيدلية', 'صيدليات', 'دواء'],
      electronics: ['electronics', 'electronic', 'mobile', 'phones', 'tech', 'computer', 'إلكترونيات', 'الكترونيات', 'موبايل', 'هواتف', 'اتصالات', 'شواحن', 'صيانة'],
      automotive: ['cars', 'car', 'auto', 'automotive', 'سيارات', 'سيارة', 'معرض', 'قطع غيار', 'زيوت', 'غسيل', 'تبديل زيوت', 'بنشر'],
      cars: ['cars', 'car', 'auto', 'automotive', 'سيارات', 'سيارة', 'معرض', 'قطع غيار', 'زيوت'],
      home: ['home', 'furniture', 'decor', 'household', 'أثاث', 'منزلي', 'ديكور', 'مفروشات'],
      perfumes: ['perfume', 'perfumes', 'fragrance', 'cosmetics', 'beauty', 'عطور', 'عطر', 'تجميل', 'مكياج', 'بخور'],
      sweets: ['sweets', 'sweet', 'bakery', 'pastry', 'dessert', 'حلويات', 'كيك', 'معجنات', 'بقلاوة'],
      services: ['services', 'service', 'maintenance', 'repair', 'خدمات', 'صيانة', 'تصليح', 'تبريد', 'كهرباء', 'سبالت', 'تأسيسات'],
      'used-goods': ['مستعمل', 'مستعملة', 'بالة', 'used', 'used_goods', 'أجهزة مستعملة', 'سيارات مستعملة', 'أثاث مستعمل'],
      'lost-found': ['مفقود', 'مفقودات', 'موجودات', 'ضائع', 'lost', 'found', 'lost_found'],
      jobs: ['وظائف', 'وظيفة', 'عمل', 'عمال', 'موظف', 'كاشير', 'مندوب', 'job', 'jobs'],
    };

    if (categoryAliases[cat.id]?.some((alias) => itemCat.includes(alias) || itemSub.includes(alias))) {
      return true;
    }

    // 3. Arabic title & shortTitle match
    if (itemCat.includes(cat.title.toLowerCase()) || itemCat.includes(cat.shortTitle.toLowerCase())) {
      return true;
    }

    // 4. Tags match
    return cat.tagsMatch.some(
      (tag) =>
        itemCat.includes(tag) ||
        itemSub.includes(tag) ||
        itemName.includes(tag) ||
        item.tags?.some((t) => t.toLowerCase().includes(tag))
    );
  };

  // Filter items matching governorate, district, category, and search query
  const filteredStores = useMemo(() => {
    if (!activeCategory) return [];

    const matched = items.filter((item) => {
      // 1. Governorate match (support both ID and Arabic Name, and allow items without governorateId to show in all)
      if (item.governorateId && item.governorateId !== 'all' && governorateId !== 'all') {
        const matchesGovId = item.governorateId === governorateId;
        const matchesGovName = Boolean(item.governorateName && governorateName && item.governorateName.trim() === governorateName.trim());
        if (!matchesGovId && !matchesGovName) {
          return false;
        }
      }

      // 2. District match (support both ID and Arabic Name)
      if (districtId !== 'all') {
        const matchesDistId = item.districtId === districtId || item.districtId === 'all' || item.districtId === 'center';
        const matchesDistName = Boolean(item.districtName && districtName && item.districtName.trim() === districtName.trim());
        if (item.districtId && !matchesDistId && !matchesDistName) {
          return false;
        }
      }

      // 3. Category match
      if (!itemMatchesCategory(item, activeCategory)) {
        return false;
      }

      // 4. Job specific sub-filter
      if (activeCategory.id === 'jobs' && jobFilter !== 'all') {
        if (jobFilter === 'employer' && item.subCategory?.includes('باحث عن عمل')) {
          return false;
        }
        if (jobFilter === 'seeker' && !item.subCategory?.includes('باحث عن عمل')) {
          return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSub = item.subCategory?.toLowerCase().includes(q);
        const matchesAddr = item.address?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesGov = item.governorateName?.toLowerCase().includes(q);
        const matchesDist = item.districtName?.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchesName && !matchesSub && !matchesAddr && !matchesDesc && !matchesPhone && !matchesGov && !matchesDist && !matchesTags) {
          return false;
        }
      }

      return true;
    });

    // Deduplicate items to ensure important service numbers and store listings are not duplicated
    const seenIds = new Set<string>();
    const seenPhones = new Set<string>();
    const seenNames = new Set<string>();

    return matched.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);

      const normPhone = item.phone ? item.phone.replace(/\D/g, '') : '';
      const normName = item.name ? item.name.trim().toLowerCase() : '';

      // Check short service / emergency numbers (e.g. 104, 115, 122, 159, 5666)
      if (normPhone && normPhone.length <= 5) {
        if (seenPhones.has(normPhone)) return false;
        seenPhones.add(normPhone);
      } else if (normPhone && normName) {
        const key = `${normName}_${normPhone}`;
        if (seenNames.has(key)) return false;
        seenNames.add(key);
      }

      return true;
    });
  }, [items, governorateId, districtId, governorateName, districtName, activeCategory, searchQuery, jobFilter]);

  // Fallback: If no stores in this specific district, find nearby stores in the same governorate
  const nearbyGovernorateStores = useMemo(() => {
    if (!activeCategory || filteredStores.length > 0 || districtId === 'all') return [];

    return items.filter((item) => {
      if (item.governorateId && item.governorateId !== governorateId) return false;
      return itemMatchesCategory(item, activeCategory);
    });
  }, [items, governorateId, districtId, activeCategory, filteredStores.length]);

  // Count items per category in this location
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CIRCULAR_CATEGORIES.forEach((cat) => {
      const count = items.filter((item) => {
        if (item.governorateId && item.governorateId !== 'all' && governorateId !== 'all') {
          const matchesGovId = item.governorateId === governorateId;
          const matchesGovName = Boolean(item.governorateName && governorateName && item.governorateName.trim() === governorateName.trim());
          if (!matchesGovId && !matchesGovName) {
            return false;
          }
        }
        if (districtId !== 'all') {
          const matchesDistId = item.districtId === districtId || item.districtId === 'all' || item.districtId === 'center';
          const matchesDistName = Boolean(item.districtName && districtName && item.districtName.trim() === districtName.trim());
          if (item.districtId && !matchesDistId && !matchesDistName) {
            return false;
          }
        }
        return itemMatchesCategory(item, cat);
      }).length;
      counts[cat.id] = count;
    });
    return counts;
  }, [items, governorateId, districtId, governorateName, districtName]);

  // Open appropriate add modal depending on active category
  const handleOpenAdd = () => {
    if (!activeCategory) return;
    if (activeCategory.id === 'used-goods') {
      setCommunityModalType('used_goods');
    } else if (activeCategory.id === 'lost-found') {
      setCommunityModalType('lost_found');
    } else if (activeCategory.id === 'jobs') {
      setCommunityModalType('job');
    } else {
      onOpenStoreModal();
    }
  };

  // =========================================================================
  // VIEW 1: CIRCULAR CATEGORIES (When no category is clicked yet)
  // Back navigation is available via on-screen button & native phone back button.
  // =========================================================================
  if (!activeCategory) {
    return (
      <div className="space-y-3.5 animate-in fade-in duration-200">
        {/* المربع الإعلاني لصفحة المتاجر والأقسام بسعر 10 آلاف دينار مع انيميشن ملكي جذاب */}
        <StoreCategoryAnimatedAdBanner
          categoryTitle={districtName && districtName !== 'all' ? districtName : governorateName}
          onOpenClaimStoreModal={onClaimStore}
        />

        {/* Top Header with Back Navigation to Districts */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <ArrowRight className="h-4 w-4" />
              <span>رجوع للأقضية</span>
            </button>
          ) : (
            <div />
          )}
          <div className="text-center">
            <h3 className="font-display text-xs sm:text-sm font-extrabold text-slate-900">
              أقسام {districtName && districtName !== 'all' ? districtName : governorateName}
            </h3>
          </div>
          <div className="w-16 sm:w-20" />
        </div>

        {/* Categories Card with Extra Enlarged Circular Icons */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
          {/* Circular Categories Grid - Extra Large per user request */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-7 gap-x-3 sm:gap-6 justify-items-center">
            {CIRCULAR_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSelectCategory(cat.id);
                  }}
                  className="group flex flex-col items-center text-center cursor-pointer transition-transform duration-150 active:scale-90 w-full"
                >
                  {/* Extra Large Circular Button */}
                  <div
                    className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full ${cat.colorClass} shadow-md group-hover:scale-108 transition-all duration-200 border-2 border-white/40`}
                  >
                    <span className="text-3xl sm:text-4xl select-none drop-shadow-xs">{cat.icon}</span>
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 border-2 border-white px-1 text-[9px] font-extrabold text-white shadow-xs">
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Title underneath the circle */}
                  <span className="mt-2.5 text-center text-xs sm:text-sm font-extrabold text-slate-800 leading-tight group-hover:text-sky-700 transition-colors line-clamp-2 px-0.5">
                    {cat.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* District Emergency Numbers Section inside the District view */}
        <DistrictEmergencySection
          districtName={districtName}
          governorateName={governorateName}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: OPENED CATEGORY VIEW
  // Prominent back button to return to categories + native phone back support
  // =========================================================================
  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      
      {/* Category Header with Back Navigation and Category Notification Bell */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs gap-2">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 sm:px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer active:scale-95 flex-shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
          <span className="hidden xs:inline">رجوع للأقسام</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xl sm:text-2xl flex-shrink-0">{activeCategory.icon}</span>
          <h3 className="font-display text-xs sm:text-sm font-extrabold text-slate-900 truncate">
            {activeCategory.title}
          </h3>
        </div>

        {/* Store count badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl whitespace-nowrap">
            {filteredStores.length} نشاط
          </span>
        </div>
      </div>

      {/* DEDICATED SEARCH BAR INSIDE CATEGORY */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xs">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute right-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeCategory.searchPlaceholder}
            className="w-full rounded-xl bg-slate-50 py-2.5 pr-9 pl-8 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-sky-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
              title="مسح البحث"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Job Sub-filters if in Jobs Category */}
      {activeCategory.id === 'jobs' && (
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setJobFilter('all')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              jobFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setJobFilter('employer')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              jobFilter === 'employer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            مطلوب موظف/عامل 👔
          </button>
          <button
            type="button"
            onClick={() => setJobFilter('seeker')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              jobFilter === 'seeker' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            باحث عن عمل 🙋‍♂️
          </button>
        </div>
      )}

      {/* المربع الإعلاني لصفحة المتاجر والأقسام بسعر 10 آلاف دينار مع انيميشن ملكي جذاب */}
      <StoreCategoryAnimatedAdBanner
        categoryTitle={activeCategory.title}
        onOpenClaimStoreModal={onClaimStore}
      />

      {/* Quick Add Button at Top of Category for rapid posting */}
      <button
        type="button"
        onClick={handleOpenAdd}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 active:scale-98 text-white py-3 px-4 font-display text-xs sm:text-sm font-extrabold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4 stroke-[3]" />
        <span>{activeCategory.addLabel} في {districtName !== 'all' ? districtName : governorateName}</span>
      </button>

      {/* Store & Post Cards List - Clean, enlarged image & clear name */}
      {filteredStores.length > 0 ? (
        <div className="space-y-3">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              onClick={() => onSelectItem(store)}
              className="group relative flex items-center gap-4 rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99]"
            >
              {/* Enlarged Store / Restaurant Image */}
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/90 shadow-2xs">
                <img
                  src={store.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                  alt={store.name}
                  className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Restaurant / Store Name - Prominent & Beautiful */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-display text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-700 transition-colors leading-snug line-clamp-2">
                  {store.name}
                </h4>
              </div>

              {/* Left Arrow Icon indicating click to open store profile */}
              <div className="shrink-0 pl-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 transition-all shadow-2xs">
                  <ChevronLeft className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : nearbyGovernorateStores.length > 0 ? (
        /* If no direct stores in the small district, show nearby stores from the governorate */
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-amber-900 text-xs">
            <p className="font-bold flex items-center gap-1">
              <span>📍</span>
              <span>
                لا توجد نتائج مسجلة مباشرة في قضاء {districtName}، إليك الأنشطة المتاحة في محافظة {governorateName}:
              </span>
            </p>
          </div>

          {nearbyGovernorateStores.map((store) => (
            <div
              key={store.id}
              onClick={() => onSelectItem(store)}
              className="group relative flex items-center gap-4 rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99]"
            >
              {/* Enlarged Store / Restaurant Image */}
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/90 shadow-2xs">
                <img
                  src={store.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                  alt={store.name}
                  className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Restaurant / Store Name - Prominent & Beautiful */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-display text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-700 transition-colors leading-snug line-clamp-2">
                  {store.name}
                </h4>
              </div>

              {/* Left Arrow Icon indicating click to open store profile */}
              <div className="shrink-0 pl-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 transition-all shadow-2xs">
                  <ChevronLeft className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <span className="text-4xl">{activeCategory.icon}</span>
          <h4 className="font-display text-sm font-bold text-slate-900">
            لا توجد إعلانات أو أنشطة مسجلة حالياً
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            كن أول من يضيف إعلاناً أو نشاطاً في {activeCategory.title} في {districtName !== 'all' ? districtName : governorateName}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            >
              {activeCategory.addLabel} الآن
            </button>
          </div>
        </div>
      )}

      {/* Community Post Modal for Used Goods, Lost & Found, and Jobs */}
      {communityModalType && (
        <AddCommunityPostModal
          isOpen={true}
          onClose={() => setCommunityModalType(null)}
          postType={communityModalType}
          governorateId={governorateId}
          governorateName={governorateName}
          districtId={districtId}
          districtName={districtName}
        />
      )}
    </div>
  );
};
