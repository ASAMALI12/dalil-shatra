/**
 * Category matching & normalization utility
 * Maps any store category, subcategory, or tag to standard circular category IDs.
 * Strictly isolates stores by true function / job (الوظيفة الحقيقية للمتجر)
 * preventing cross-contamination between restaurants, maintenance, electronics, medical, etc.
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
 * Helper to normalize and search Arabic text without diacritics
 */
function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .trim();
}

/**
 * Authoritative categorization function that isolates every store strictly by its functional job.
 * Ensures restaurants NEVER appear in maintenance/services, and maintenance NEVER appears in restaurants.
 */
export const getStoreCanonicalCategory = (item?: {
  category?: string;
  subCategory?: string;
  name?: string;
  itemType?: string;
  tags?: string[];
  description?: string;
}): string => {
  if (!item) return 'services';

  // 1. Special directory item types take immediate precedence
  if (item.itemType === 'used_goods' || item.category === 'used-goods') return 'used-goods';
  if (item.itemType === 'lost_found' || item.category === 'lost-found') return 'lost-found';
  if (item.itemType === 'job' || item.category === 'jobs') return 'jobs';

  const rawCat = (item.category || '').toLowerCase().trim();
  const rawSub = (item.subCategory || '').toLowerCase().trim();
  const rawName = (item.name || '').toLowerCase().trim();
  const rawDesc = (item.description || '').toLowerCase().trim();
  const rawTags = (item.tags || []).join(' ').toLowerCase();

  const normCat = normalizeText(item.category);
  const normSub = normalizeText(item.subCategory);
  const normName = normalizeText(item.name);
  const normDesc = normalizeText(item.description);
  const normTags = normalizeText((item.tags || []).join(' '));

  const fullText = `${normName} ${normSub} ${normCat} ${normDesc} ${normTags}`;

  // Check for used goods keywords
  if (normName.includes('مستعمل') || normSub.includes('مستعمل') || normCat.includes('مستعمل') || normName.includes('باله')) {
    return 'used-goods';
  }

  // Check for jobs keywords
  if (normName.includes('فرص عمل') || normCat.includes('توظيف') || normSub.includes('وظائف')) {
    return 'jobs';
  }

  // -------------------------------------------------------------
  // 2. AUTOMOTIVE (معارض والسيارات والفيترية وقطع الغيار)
  // -------------------------------------------------------------
  const isAutomotive =
    normCat === 'automotive' || normCat === 'cars' || normCat === 'auto' || normCat.includes('سيارات') ||
    normSub.includes('سيارات') || normSub.includes('قطع غيار') || normSub.includes('زيوت') ||
    normName.includes('معرض سيارات') || normName.includes('تجاره سيارات') || normName.includes('ادوات احتياطيه') ||
    normName.includes('قطع غيار سيارات') || normName.includes('فيتر') || normName.includes('بنشر') ||
    normName.includes('زيوت سيارات') || normName.includes('غسيل سيارات') || normName.includes('مغسله سيارات') ||
    normName.includes('اطارات') || normName.includes('تايرات') || normName.includes('بطاريات سيارات') ||
    normName.includes('ميكانيك سيارات') || normName.includes('كهربائي سيارات') || normName.includes('حداده سيارات');

  if (isAutomotive) {
    return 'automotive';
  }

  // -------------------------------------------------------------
  // 3. MOBILE & ELECTRONICS (الموبايل والإلكترونيات وصيانة الهواتف)
  // -------------------------------------------------------------
  const isMobileOrElectronics =
    normCat === 'electronics' || normCat === 'mobile' || normCat === 'phones' || normCat === 'electronic' || normCat.includes('موبايل') || normCat.includes('الكترون') ||
    normSub.includes('موبايل') || normSub.includes('هواتف') || normSub.includes('الكترونيات') || normSub.includes('حاسبات') || normSub.includes('لابتوب') ||
    normName.includes('موبايل') || normName.includes('هواتف') || normName.includes('تلفونات') || normName.includes('جوال') ||
    normName.includes('الكترونيات') || normName.includes('لابتوب') || normName.includes('حاسبات') || normName.includes('كمبيوتر') ||
    normName.includes('بلايستيشن') || normName.includes('بلاي ستيشن') || normName.includes('العاب فيديو') ||
    normName.includes('صيانه موبايل') || normName.includes('صيانه هواتف') || normName.includes('تصليح موبايل') || normName.includes('تبديل شاشات') ||
    normName.includes('كاميرات مراقبه') || normName.includes('منظومات انترنت') || normName.includes('ستلايت');

  if (isMobileOrElectronics) {
    return 'electronics';
  }

  // -------------------------------------------------------------
  // 4. MEDICAL & PHARMACIES (الأطباء والعيادات والصيدليات)
  // -------------------------------------------------------------
  const isMedical =
    normCat === 'medical' || normCat === 'doctors' || normCat === 'pharmacies' || normCat === 'doctor' || normCat === 'pharmacy' ||
    normCat.includes('اطباء') || normCat.includes('صيدل') || normCat.includes('عياد') || normCat.includes('صحه') ||
    normSub.includes('طبيب') || normSub.includes('عياده') || normSub.includes('صيدليه') || normSub.includes('مختبر') || normSub.includes('اسنان') ||
    normName.includes('طبيب') || normName.includes('دكتور') || normName.includes('عياده') || normName.includes('صيدليه') ||
    normName.includes('مستشفي') || normName.includes('مختبر') || normName.includes('تحليلات') || normName.includes('اسنان') ||
    normName.includes('باطنيه') || normName.includes('اطفال') || normName.includes('نسائيه') || normName.includes('سونار') ||
    normName.includes('مجمع طبي') || normName.includes('مركز صحي') || normName.includes('مذخر ادويه');

  if (isMedical) {
    return 'medical';
  }

  // -------------------------------------------------------------
  // 5. RESTAURANTS & FOOD (المطاعم والمأكولات والوجبات)
  // Must be checked before generic "services" to prevent restaurants
  // from ever being classified as maintenance!
  // -------------------------------------------------------------
  const isRestaurantFood =
    normCat === 'restaurants' || normCat === 'restaurant' || normCat === 'food' || normCat.includes('مطاعم') || normCat.includes('ماكولات') || normCat.includes('وجبات') ||
    normSub.includes('مطعم') || normSub.includes('مشاوي') || normSub.includes('كباب') || normSub.includes('شاورما') || normSub.includes('وجبات سريعه') || normSub.includes('بيتزا') || normSub.includes('برغر') || normSub.includes('مندي') || normSub.includes('فلافل') || normSub.includes('ماكولات') ||
    normName.includes('مطعم') || normName.includes('مشاوي') || normName.includes('مشويات') || normName.includes('كباب') ||
    normName.includes('شاورما') || normName.includes('برغر') || normName.includes('برجر') || normName.includes('همبرغر') ||
    normName.includes('بيتزا') || normName.includes('مندي') || normName.includes('قوزي') || normName.includes('مظبي') || normName.includes('بخاري') ||
    normName.includes('فلافل') || normName.includes('ماكولات') || normName.includes('وجبات') || normName.includes('كص') ||
    normName.includes('سمك') || normName.includes('اسماك') || normName.includes('مسكوف') || normName.includes('باجه') ||
    normName.includes('تشريب') || normName.includes('قيمه') || normName.includes('دليميه') || normName.includes('ساندويش') ||
    normName.includes('ساندوتش') || normName.includes('بروستد') || normName.includes('فرايد تشيكن') || normName.includes('شوايه') ||
    normName.includes('كبابجي') || normName.includes('فطائر') || normName.includes('لحم بعجين') ||
    (normName.includes('مطبخ') && (fullText.includes('ولائم') || fullText.includes('اكلات') || fullText.includes('سفري') || fullText.includes('طعام')));

  if (isRestaurantFood) {
    return 'restaurants';
  }

  // -------------------------------------------------------------
  // 6. CAFES & SWEETS & ICE CREAM (الكافيهات والمقاهي والحلويات)
  // -------------------------------------------------------------
  const isCafeOrSweets =
    normCat === 'cafes' || normCat === 'cafe' || normCat === 'coffee' || normCat === 'sweets' || normCat.includes('كافيه') || normCat.includes('مقاهي') || normCat.includes('حلويات') ||
    normSub.includes('كافيه') || normSub.includes('مقهي') || normSub.includes('حلويات') || normSub.includes('عصائر') || normSub.includes('ايس كريم') ||
    normName.includes('كافيه') || normName.includes('مقهي') || normName.includes('كوفي') || normName.includes('حلويات') ||
    normName.includes('عصائر') || normName.includes('عصير') || normName.includes('ايس كريم') || normName.includes('مثلجات') ||
    normName.includes('بقلاوه') || normName.includes('كنافه') || normName.includes('كيك') || normName.includes('وافل') ||
    normName.includes('كريب') || normName.includes('قهوه') || normName.includes('بن') || normName.includes('محمصه قهوه');

  if (isCafeOrSweets) {
    return 'cafes';
  }

  // -------------------------------------------------------------
  // 7. CLOTHING & FASHION (مجمعات الألبسة والأزياء)
  // -------------------------------------------------------------
  const isClothing =
    normCat === 'clothing' || normCat === 'fashion' || normCat === 'clothes' || normCat === 'perfumes' || normCat.includes('البسه') || normCat.includes('ازياء') || normCat.includes('ملابس') ||
    normSub.includes('ملابس') || normSub.includes('البسه') || normSub.includes('ازياء') || normSub.includes('احذيه') || normSub.includes('بوتيك') ||
    normName.includes('ملابس') || normName.includes('البسه') || normName.includes('ازياء') || normName.includes('بوتيك') ||
    normName.includes('فساتين') || normName.includes('عباءات') || normName.includes('عبايات') || normName.includes('دشاديش') ||
    normName.includes('احذيه') || normName.includes('حقائب') || normName.includes('شنط') || normName.includes('بدلات') ||
    normName.includes('خياطه') || normName.includes('صاغه') || normName.includes('مجوهرات') || normName.includes('ذهب') ||
    normName.includes('عطور') || normName.includes('مكياج') || normName.includes('كوزمتك');

  if (isClothing) {
    return 'clothing';
  }

  // -------------------------------------------------------------
  // 8. SUPERMARKETS & GROCERIES (السوبر ماركت والأسواق والمواد الغذائية)
  // -------------------------------------------------------------
  const isSupermarket =
    normCat === 'supermarkets' || normCat === 'supermarket' || normCat === 'grocery' || normCat === 'markets' || normCat.includes('اسواق') || normCat.includes('سوبر ماركت') ||
    normSub.includes('اسواق') || normSub.includes('سوبر ماركت') || normSub.includes('ماركت') || normSub.includes('بقاله') || normSub.includes('مواد غذائيه') ||
    normName.includes('سوبر ماركت') || normName.includes('سوبرماركت') || normName.includes('اسواق') || normName.includes('ماركت') ||
    normName.includes('بقاله') || normName.includes('مواد غذائيه') || normName.includes('تموينيه') || normName.includes('هايبر ماركت') ||
    normName.includes('خضار وفواكه') || normName.includes('فواكه') || normName.includes('عطاره') || normName.includes('مخبز') ||
    normName.includes('افران صمون') || normName.includes('صمون') || normName.includes('قصابه') || normName.includes('البان واجبان');

  if (isSupermarket) {
    return 'supermarkets';
  }

  // -------------------------------------------------------------
  // 9. SERVICES & HOME MAINTENANCE & CRAFTS (الخدمات والصيانة المنزلية والمهن)
  // Explicit Maintenance & Trades
  // -------------------------------------------------------------
  const isMaintenanceOrServices =
    normCat === 'services' || normCat === 'service' || normCat === 'maintenance' || normCat === 'repair' || normCat === 'home' || normCat === 'beauty' ||
    normCat.includes('خدمات') || normCat.includes('صيانه') || normCat.includes('تصليح') || normCat.includes('مهن') ||
    normSub.includes('صيانه') || normSub.includes('تصليح') || normSub.includes('سباكه') || normSub.includes('كهرباء') || normSub.includes('حداده') || normSub.includes('نجاره') || normSub.includes('تبريد') ||
    normName.includes('صيانه') || normName.includes('تصليح') || normName.includes('سباكه') || normName.includes('سباك') ||
    normName.includes('صحيات') || normName.includes('تاسيسات صحيه') || normName.includes('مضخات') ||
    normName.includes('كهرباء') || normName.includes('كهربائي') || normName.includes('تاسيسات كهربائيه') ||
    normName.includes('حداده') || normName.includes('حداد') || normName.includes('لحام') ||
    normName.includes('نجاره') || normName.includes('نجار') || normName.includes('ابواب خشب') || normName.includes('المنيوم') ||
    normName.includes('تبريد') || normName.includes('تكييف') || normName.includes('سبلت') || normName.includes('سبالت') ||
    normName.includes('تصليح غسالات') || normName.includes('تصليح ثلاجات') || normName.includes('صباغه') || normName.includes('صباغ') ||
    normName.includes('تنظيف') || normName.includes('غسيل سجاد') || normName.includes('مكافحه حشرات') ||
    normName.includes('نقل اثاث') || normName.includes('اقفال') || normName.includes('مفاتيح') || normName.includes('مقاولات') ||
    normName.includes('صالون') || normName.includes('حلاقه') || normName.includes('كوافير') || normName.includes('تجميل');

  if (isMaintenanceOrServices) {
    return 'services';
  }

  // 10. Ultimate fallback strictly to 'services'
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
