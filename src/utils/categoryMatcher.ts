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

/**
 * Strict, authoritative categorization function that maps any store or directory item
 * cleanly to its canonical category ID based on its true function / job, preventing
 * any cross-contamination (e.g. restaurants mixing into maintenance or vice versa).
 */
export const getStoreCanonicalCategory = (item?: {
  category?: string;
  subCategory?: string;
  name?: string;
  itemType?: string;
  tags?: string[];
}): string => {
  if (!item) return 'services';

  // 1. Special directory item types take immediate precedence
  if (item.itemType === 'used_goods' || item.category === 'used-goods') return 'used-goods';
  if (item.itemType === 'lost_found' || item.category === 'lost-found') return 'lost-found';
  if (item.itemType === 'job' || item.category === 'jobs') return 'jobs';

  const cat = (item.category || '').toLowerCase().trim();

  // 2. Primary explicit category mapping (authoritative)
  if (cat === 'restaurants' || cat === 'restaurant' || cat === 'food') return 'restaurants';
  if (cat === 'cafes' || cat === 'cafe' || cat === 'coffee' || cat === 'sweets') return 'cafes';
  if (cat === 'medical' || cat === 'doctors' || cat === 'pharmacies' || cat === 'doctor' || cat === 'pharmacy') return 'medical';
  if (cat === 'clothing' || cat === 'fashion' || cat === 'clothes') return 'clothing';
  if (cat === 'electronics' || cat === 'mobile' || cat === 'phones' || cat === 'electronic') return 'electronics';
  if (cat === 'supermarkets' || cat === 'supermarket' || cat === 'grocery' || cat === 'markets') return 'supermarkets';
  if (cat === 'automotive' || cat === 'cars' || cat === 'car' || cat === 'auto') return 'automotive';
  if (cat === 'services' || cat === 'service' || cat === 'maintenance' || cat === 'repair') return 'services';
  if (cat === 'beauty') return 'services'; // صالونات وتجميل وعناية
  if (cat === 'perfumes') return 'clothing'; // عطور ومكياج
  if (cat === 'home') return 'services'; // ديكور وأثاث منزلي

  // 3. High-precision keyword check strictly if category is 'general', 'other', or undefined
  const name = (item.name || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();

  // Restaurants & Dining
  if (
    name.includes('مطعم') || name.includes('مشاوي') || name.includes('كباب') ||
    name.includes('شاورما') || name.includes('برغر') || name.includes('بيتزا') ||
    name.includes('قوزي') || name.includes('مندي') || name.includes('فلافل') ||
    name.includes('مأكولات') || sub.includes('مشاوي') || sub.includes('وجبات سريعة')
  ) {
    return 'restaurants';
  }

  // Cafes & Coffee & Desserts
  if (name.includes('كافيه') || name.includes('مقهى') || name.includes('كوفي') || name.includes('حلويات') || name.includes('عصائر')) {
    return 'cafes';
  }

  // Medical, Clinics, Doctors, Pharmacies
  if (name.includes('طبيب') || name.includes('عيادة') || name.includes('صيدلية') || name.includes('دكتور') || name.includes('مستشفى') || name.includes('مختبر') || name.includes('أسنان')) {
    return 'medical';
  }

  // Mobile & Electronics
  if (name.includes('موبايل') || name.includes('هواتف') || name.includes('إلكترون') || name.includes('حاسبات') || name.includes('لابتوب')) {
    return 'electronics';
  }

  // Clothing & Fashion
  if (name.includes('ملابس') || name.includes('أزياء') || name.includes('ألبسة') || name.includes('بوتيك') || name.includes('فساتين') || name.includes('أحذية')) {
    return 'clothing';
  }

  // Supermarkets & Groceries
  if (name.includes('سوبر ماركت') || name.includes('سوبرماركت') || name.includes('أسواق') || name.includes('ماركت') || name.includes('بقالة')) {
    return 'supermarkets';
  }

  // Automotive
  if (name.includes('سيارات') || name.includes('معرض سيارات') || name.includes('قطع غيار') || name.includes('غسيل سيارات') || name.includes('زيوت سيارات')) {
    return 'automotive';
  }

  // Home maintenance & Technical crafts
  if (name.includes('صيانة') || name.includes('تصليح') || name.includes('تبريد') || name.includes('سباكة') || name.includes('كهرباء') || name.includes('حدادة') || name.includes('نجارة')) {
    return 'services';
  }

  return 'services';
};

export const normalizeCategoryId = (raw?: string): string => {
  if (!raw) return 'services';
  return getStoreCanonicalCategory({ category: raw });
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
