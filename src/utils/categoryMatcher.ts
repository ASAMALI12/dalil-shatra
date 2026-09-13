/**
 * Category matching & normalization utility
 * Maps any store category, subcategory, or tag to standard circular category IDs.
 */

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORY_INFO_MAP: Record<string, CategoryInfo> = {
  restaurants: { id: 'restaurants', name: 'المطاعم والمأكولات', icon: '🍽️' },
  supermarkets: { id: 'supermarkets', name: 'السوبر ماركت والمتاجر', icon: '🛒' },
  clothing: { id: 'clothing', name: 'مجمعات الألبسة والأزياء', icon: '🛍️' },
  electronics: { id: 'electronics', name: 'محلات الموبايل والإلكترونيات', icon: '📱' },
  cafes: { id: 'cafes', name: 'الكافيهات والمقاهي', icon: '☕' },
  medical: { id: 'medical', name: 'الأطباء والعيادات والصيدليات', icon: '🩺' },
  services: { id: 'services', name: 'الخدمات والصيانة المنزلية', icon: '🔧' },
  automotive: { id: 'automotive', name: 'معارض والسيارات', icon: '🚗' },
  'used-goods': { id: 'used-goods', name: 'سوق المواد المستعملة', icon: '♻️' },
  'lost-found': { id: 'lost-found', name: 'المفقودات والموجودات', icon: '🔍' },
  jobs: { id: 'jobs', name: 'فرص العمل والتوظيف', icon: '💼' },
};

export const normalizeCategoryId = (raw?: string): string => {
  if (!raw) return 'general';
  const s = raw.toLowerCase().trim();

  // 1. Restaurants & Food
  if (
    s === 'restaurants' ||
    s === 'food' ||
    s.includes('مطعم') ||
    s.includes('مطاعم') ||
    s.includes('مأكول') ||
    s.includes('وجبات') ||
    s.includes('شاورما') ||
    s.includes('مشويات') ||
    s.includes('بيتزا') ||
    s.includes('برغر') ||
    s.includes('كباب') ||
    s.includes('restaurant')
  ) {
    return 'restaurants';
  }

  // 2. Medical, Doctors, Clinics & Pharmacies
  if (
    s === 'medical' ||
    s === 'doctor' ||
    s === 'health' ||
    s.includes('طبيب') ||
    s.includes('أطباء') ||
    s.includes('عياد') ||
    s.includes('صيدل') ||
    s.includes('مستشفى') ||
    s.includes('مختبر') ||
    s.includes('أسنان') ||
    s.includes('باطنية') ||
    s.includes('صحة')
  ) {
    return 'medical';
  }

  // 3. Clothing & Fashion
  if (
    s === 'clothing' ||
    s === 'fashion' ||
    s.includes('ملابس') ||
    s.includes('ألبسة') ||
    s.includes('أزياء') ||
    s.includes('أحذية') ||
    s.includes('حقائب') ||
    s.includes('بوتيك') ||
    s.includes('فساتين')
  ) {
    return 'clothing';
  }

  // 4. Supermarket & Grocery Stores
  if (
    s === 'supermarkets' ||
    s === 'supermarket' ||
    s === 'markets' ||
    s.includes('سوبر') ||
    s.includes('ماركت') ||
    s.includes('بقالة') ||
    s.includes('متجر') ||
    s.includes('متاجر') ||
    s.includes('أسواق') ||
    s.includes('هايبر') ||
    s.includes('غذائية')
  ) {
    return 'supermarkets';
  }

  // 5. Electronics & Mobiles
  if (
    s === 'electronics' ||
    s === 'phones' ||
    s.includes('موبايل') ||
    s.includes('هواتف') ||
    s.includes('إلكترون') ||
    s.includes('تقني') ||
    s.includes('لابتوب') ||
    s.includes('كمبيوتر')
  ) {
    return 'electronics';
  }

  // 6. Cafes & Coffee
  if (
    s === 'cafes' ||
    s === 'coffee' ||
    s.includes('كافيه') ||
    s.includes('مقهى') ||
    s.includes('كوفي') ||
    s.includes('شاي') ||
    s.includes('عصائر') ||
    s.includes('حلويات')
  ) {
    return 'cafes';
  }

  // 7. Services & Home Maintenance
  if (
    s === 'services' ||
    s === 'repair' ||
    s.includes('خدمات') ||
    s.includes('مهن') ||
    s.includes('صيانة') ||
    s.includes('تصليح') ||
    s.includes('سباك') ||
    s.includes('كهربائ') ||
    s.includes('حدادة') ||
    s.includes('نجارة')
  ) {
    return 'services';
  }

  // 8. Automotive & Cars
  if (
    s === 'automotive' ||
    s === 'cars' ||
    s.includes('سيار') ||
    s.includes('معارض') ||
    s.includes('إطارات') ||
    s.includes('زيوت') ||
    s.includes('غسيل سيارات')
  ) {
    return 'automotive';
  }

  // 9. Community
  if (s === 'used-goods' || s.includes('مستعمل')) return 'used-goods';
  if (s === 'lost-found' || s.includes('مفقود') || s.includes('موجودات')) return 'lost-found';
  if (s === 'jobs' || s.includes('وظائف') || s.includes('عمل') || s.includes('توظيف')) return 'jobs';

  return s;
};

export const doesCategoryMatch = (catA?: string, catB?: string): boolean => {
  if (!catA || !catB) return false;
  if (catA === 'all' || catB === 'all') return true;
  return normalizeCategoryId(catA) === normalizeCategoryId(catB);
};

export const getCategoryDisplayInfo = (catIdOrName?: string): CategoryInfo => {
  const normalized = normalizeCategoryId(catIdOrName);
  return (
    CATEGORY_INFO_MAP[normalized] || {
      id: normalized,
      name: catIdOrName || 'القسم التجاري',
      icon: '🏪',
    }
  );
};
