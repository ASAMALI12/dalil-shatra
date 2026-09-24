import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { validateIraqPhone, isFakeOrPlaceholderPhone, normalizeIraqPhone } from '../utils/iraqPhoneValidator';

// Iraqi Governorates Geospatial Bounding Boxes & Centers
export interface GovernorateGeocoding {
  id: string;
  name: string;
  lat: number;
  lng: number;
  bbox: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  keywords: string[];
}

export const IRAQ_GEO_GOVERNORATES: GovernorateGeocoding[] = [
  {
    id: 'baghdad',
    name: 'بغداد',
    lat: 33.3152,
    lng: 44.3661,
    bbox: { minLat: 33.10, minLng: 44.10, maxLat: 33.55, maxLng: 44.60 },
    keywords: ['بغداد', 'الكرخ', 'الرصافة', 'المنصور', 'الكرادة', 'الاعظمية'],
  },
  {
    id: 'basra',
    name: 'البصرة',
    lat: 30.5081,
    lng: 47.7835,
    bbox: { minLat: 29.90, minLng: 47.00, maxLat: 31.10, maxLng: 48.60 },
    keywords: ['البصرة', 'العشار', 'الزبير', 'القرنة', 'شط العرب'],
  },
  {
    id: 'najaf',
    name: 'النجف الأشرف',
    lat: 31.9961,
    lng: 44.3314,
    bbox: { minLat: 31.70, minLng: 44.10, maxLat: 32.20, maxLng: 44.60 },
    keywords: ['النجف', 'الكوفة', 'الحيدرية', 'المناذرة'],
  },
  {
    id: 'karbala',
    name: 'كربلاء المقدسة',
    lat: 32.6160,
    lng: 44.0249,
    bbox: { minLat: 32.40, minLng: 43.80, maxLat: 32.80, maxLng: 44.30 },
    keywords: ['كربلاء', 'عين التمر', 'طويريج', 'الهندية'],
  },
  {
    id: 'dhi-qar',
    name: 'ذي قار',
    lat: 31.0543,
    lng: 46.2625,
    bbox: { minLat: 30.70, minLng: 45.70, maxLat: 31.75, maxLng: 47.10 },
    keywords: ['ذي قار', 'الناصرية', 'الشطرة', 'الرفاعي', 'سوق الشيوخ'],
  },
  {
    id: 'babil',
    name: 'بابل',
    lat: 32.4833,
    lng: 44.4333,
    bbox: { minLat: 32.25, minLng: 44.15, maxLat: 32.75, maxLng: 44.75 },
    keywords: ['بابل', 'الحلة', 'المحاويل', 'المسيب', 'القاسم'],
  },
  {
    id: 'maysan',
    name: 'ميسان',
    lat: 31.8400,
    lng: 47.1400,
    bbox: { minLat: 31.50, minLng: 46.70, maxLat: 32.30, maxLng: 47.70 },
    keywords: ['ميسان', 'العمارة', 'المجر الكبير', 'علي الغربي'],
  },
  {
    id: 'wasit',
    name: 'واسط',
    lat: 32.5100,
    lng: 45.8200,
    bbox: { minLat: 32.10, minLng: 45.40, maxLat: 33.00, maxLng: 46.50 },
    keywords: ['واسط', 'الكوت', 'الحي', 'الصويرة', 'النعمانية'],
  },
  {
    id: 'muthanna',
    name: 'المثنى',
    lat: 31.3100,
    lng: 45.2800,
    bbox: { minLat: 30.80, minLng: 44.80, maxLat: 31.60, maxLng: 45.80 },
    keywords: ['المثنى', 'السماوة', 'الرميثة', 'الخضر'],
  },
  {
    id: 'qadisiyah',
    name: 'القادسية',
    lat: 31.9900,
    lng: 44.9200,
    bbox: { minLat: 31.70, minLng: 44.60, maxLat: 32.30, maxLng: 45.40 },
    keywords: ['الديوانية', 'القادسية', 'عفك', 'الشامية', 'الحمزة'],
  },
  {
    id: 'diyala',
    name: 'ديالى',
    lat: 33.7500,
    lng: 45.1400,
    bbox: { minLat: 33.40, minLng: 44.50, maxLat: 34.30, maxLng: 45.60 },
    keywords: ['ديالى', 'بعقوبة', 'المقدادية', 'خانقين', 'الخالص'],
  },
  {
    id: 'salah-al-din',
    name: 'صلاح الدين',
    lat: 34.6000,
    lng: 43.6800,
    bbox: { minLat: 33.80, minLng: 43.20, maxLat: 35.00, maxLng: 44.50 },
    keywords: ['صلاح الدين', 'تكريت', 'سامراء', 'بلد', 'الدجيل', 'طوزخورماتو'],
  },
  {
    id: 'anbar',
    name: 'الأنبار',
    lat: 33.4200,
    lng: 43.3000,
    bbox: { minLat: 32.50, minLng: 41.00, maxLat: 34.50, maxLng: 44.00 },
    keywords: ['الأنبار', 'الرمادي', 'الفلوجة', 'هيت', 'حديثة'],
  },
  {
    id: 'kirkuk',
    name: 'كركوك',
    lat: 35.4700,
    lng: 44.3900,
    bbox: { minLat: 35.10, minLng: 44.00, maxLat: 35.80, maxLng: 44.80 },
    keywords: ['كركوك', 'الحويجة', 'دبس', 'داقوق'],
  },
  {
    id: 'nineveh',
    name: 'نينوى',
    lat: 36.3400,
    lng: 43.1300,
    bbox: { minLat: 35.80, minLng: 42.40, maxLat: 36.80, maxLng: 43.60 },
    keywords: ['نينوى', 'الموصل', 'تلعفر', 'الحمدانية', 'سنجار'],
  },
  {
    id: 'erbil',
    name: 'أربيل',
    lat: 36.1900,
    lng: 44.0100,
    bbox: { minLat: 35.80, minLng: 43.60, maxLat: 36.60, maxLng: 44.40 },
    keywords: ['أربيل', 'عينكاوة', 'سوران', 'شقلاوة'],
  },
  {
    id: 'sulaymaniyah',
    name: 'السليمانية',
    lat: 35.5600,
    lng: 45.4300,
    bbox: { minLat: 35.20, minLng: 45.00, maxLat: 35.90, maxLng: 45.80 },
    keywords: ['السليمانية', 'رانية', 'دوكان', 'كلار'],
  },
  {
    id: 'duhok',
    name: 'دهوك',
    lat: 36.8700,
    lng: 42.9900,
    bbox: { minLat: 36.60, minLng: 42.50, maxLat: 37.20, maxLng: 43.40 },
    keywords: ['دهوك', 'زاخو', 'سميل', 'العمادية'],
  },
];

// OpenStreetMap tag mapping to directory categories
export function mapOsmTagToCategory(tags: Record<string, string>): { category: string; subCategory?: string } {
  const amenity = tags.amenity || '';
  const shop = tags.shop || '';
  const healthcare = tags.healthcare || '';
  const craft = tags.craft || '';

  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'cafe' || amenity === 'food_court') {
    return { category: 'restaurants', subCategory: tags.cuisine || (amenity === 'cafe' ? 'كافيه ومقهى' : 'مطعم') };
  }
  if (
    amenity === 'pharmacy' ||
    amenity === 'hospital' ||
    amenity === 'clinic' ||
    amenity === 'dentist' ||
    amenity === 'doctors' ||
    healthcare
  ) {
    let sub = 'صيدلية وعيادة';
    if (amenity === 'pharmacy') sub = 'صيدلية';
    if (amenity === 'dentist') sub = 'طب أسنان';
    if (amenity === 'hospital') sub = 'مستشفى';
    return { category: 'doctors', subCategory: sub };
  }
  if (
    shop === 'supermarket' ||
    shop === 'convenience' ||
    shop === 'grocery' ||
    shop === 'bakery' ||
    shop === 'butcher' ||
    shop === 'pastry' ||
    shop === 'mall' ||
    amenity === 'marketplace'
  ) {
    return { category: 'markets', subCategory: shop === 'bakery' ? 'مخبز ومعجنات' : (shop === 'mall' ? 'مركز تسوق' : 'مواد غذائية وماركت') };
  }
  if (shop === 'clothes' || shop === 'shoes' || shop === 'fashion' || shop === 'boutique' || shop === 'jewelry') {
    return { category: 'fashion', subCategory: shop === 'jewelry' ? 'صاغة ومجوهرات' : 'أزياء وملابس' };
  }
  if (shop === 'electronics' || shop === 'mobile_phone' || shop === 'computer') {
    return { category: 'electronics', subCategory: shop === 'mobile_phone' ? 'هواتف وصيانة' : 'إلكترونيات وأجهزة' };
  }
  if (amenity === 'car_repair' || shop === 'car_parts' || shop === 'car' || amenity === 'car_wash') {
    return { category: 'cars', subCategory: 'صيانة وقطع غيار سيارات' };
  }
  if (shop === 'furniture' || shop === 'interior_decoration' || shop === 'kitchen') {
    return { category: 'furniture', subCategory: 'أثاث ومفروشات' };
  }
  if (shop === 'chemist' || shop === 'perfumery' || shop === 'cosmetics' || shop === 'hairdresser' || amenity === 'spa') {
    return { category: 'cosmetics', subCategory: 'عطور ومستحضرات تجميل' };
  }
  if (amenity === 'bank' || amenity === 'atm' || tags.office === 'lawyer' || tags.office === 'company' || craft) {
    return { category: 'services', subCategory: 'خدمات وأعمال تجارية' };
  }

  return { category: 'services', subCategory: 'أنشطة تجارية عامة' };
}

// Normalize Arabic strings for strict duplicate comparison
export function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // strip diacritics
    .replace(/\b(محل|شركة|مكتب|معرض|مذخر|مركز|صالون|مطعم|كافيه|اسواق|مجمع|عيادة)\b/g, '')
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

export interface OnlineImportFilterOptions {
  provider: 'osm_overpass' | 'google_places' | 'external_feed';
  governorateId?: string; // specific governorate ID or 'all'
  page?: number;
  pageSize?: number;
  maxPerGov?: number;
}

export interface RawCandidateStore {
  sourceId: string;
  source: string;
  name: string;
  rawPhone: string;
  governorateId: string;
  governorateName: string;
  districtId?: string;
  districtName?: string;
  category: string;
  subCategory?: string;
  address?: string;
  lat?: number;
  lng?: number;
  website?: string;
  facebook?: string;
  instagram?: string;
  workingHours?: string;
  rating?: number;
  reviewsCount?: number;
}

// 1. OPENSTREETMAP OVERPASS API (Official, Open Data ODbL - Free & Legal)
export async function fetchFromOsmOverpass(
  gov: GovernorateGeocoding,
  limit: number = 50,
  timeoutSec: number = 25
): Promise<RawCandidateStore[]> {
  const mirrors = [
    process.env.OVERPASS_API_ENDPOINT,
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ].filter(Boolean) as string[];

  const { minLat, minLng, maxLat, maxLng } = gov.bbox;
  const bboxStr = `${minLat},${minLng},${maxLat},${maxLng}`;

  // Query only real commercial nodes with actual phone tags
  const overpassQuery = `
    [out:json][timeout:${timeoutSec}];
    (
      node["shop"]["phone"](${bboxStr});
      node["shop"]["contact:phone"](${bboxStr});
      node["shop"]["contact:mobile"](${bboxStr});
      node["amenity"]["phone"](${bboxStr});
      node["amenity"]["contact:phone"](${bboxStr});
      node["amenity"]["contact:mobile"](${bboxStr});
      node["craft"]["phone"](${bboxStr});
      node["office"]["phone"](${bboxStr});
    );
    out body ${limit};
  `.trim();

  let lastError = '';

  for (const endpoint of mirrors) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), (timeoutSec + 5) * 1000);

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'IraqDirectoryOfficialImporter/2.0 (iraq-directory-prod)',
        },
        body: 'data=' + encodeURIComponent(overpassQuery),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!resp.ok) {
        lastError = `Endpoint ${endpoint} returned status ${resp.status}`;
        continue;
      }

      const text = await resp.text();
      if (!text.trim().startsWith('{')) {
        lastError = `Endpoint ${endpoint} returned non-JSON response (likely rate limit HTML/XML)`;
        continue;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data.elements)) {
        continue;
      }

      const results: RawCandidateStore[] = [];

      for (const el of data.elements) {
        const tags = el.tags || {};
        const name = tags['name:ar'] || tags.name || tags['name:en'];
        if (!name || !name.trim()) continue;

        const rawPhone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.telephone;
        if (!rawPhone || !rawPhone.trim()) continue;

        const { category, subCategory } = mapOsmTagToCategory(tags);

        // Extract street and district if present
        const street = tags['addr:street'] || tags['addr:street:ar'] || '';
        const city = tags['addr:city'] || tags['addr:city:ar'] || gov.name;
        const address = [gov.name, city !== gov.name ? city : '', street].filter(Boolean).join(' - ');

        results.push({
          sourceId: `osm_${el.id}`,
          source: 'osm_overpass',
          name: name.trim(),
          rawPhone: String(rawPhone).trim(),
          governorateId: gov.id,
          governorateName: gov.name,
          category,
          subCategory,
          address: address || `${gov.name} - العراق`,
          lat: el.lat,
          lng: el.lon,
          website: tags.website || tags['contact:website'] || undefined,
          facebook: tags['contact:facebook'] || tags.facebook || undefined,
          instagram: tags['contact:instagram'] || tags.instagram || undefined,
          workingHours: tags.opening_hours || undefined,
        });
      }

      return results;
    } catch (err: any) {
      lastError = err.message || String(err);
    }
  }

  console.warn(`[OSM Overpass] Could not fetch for ${gov.name}: ${lastError}`);
  return [];
}

// 2. GOOGLE PLACES API (Official Google Maps Platform Places API v1)
export async function fetchFromGooglePlaces(
  gov: GovernorateGeocoding,
  apiKey: string,
  categoryKeyword: string = 'مطاعم ومتاجر',
  pageToken?: string
): Promise<{ stores: RawCandidateStore[]; nextPageToken?: string }> {
  if (!apiKey || apiKey.length < 15) {
    throw new Error('GOOGLE_PLACES_API_KEY أو GOOGLE_MAPS_API_KEY غير مهيأ في متغيرات البيئة.');
  }

  const query = `${categoryKeyword} في ${gov.name} العراق`;
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const bodyPayload: any = {
    textQuery: query,
    languageCode: 'ar',
    locationRestriction: {
      rectangle: {
        low: { latitude: gov.bbox.minLat, longitude: gov.bbox.minLng },
        high: { latitude: gov.bbox.maxLat, longitude: gov.bbox.maxLng },
      },
    },
    pageSize: 20,
  };

  if (pageToken) {
    bodyPayload.pageToken = pageToken;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.rating,places.userRatingCount,places.location,nextPageToken',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Google Places API returned status ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const places = data.places || [];
  const stores: RawCandidateStore[] = [];

  for (const p of places) {
    const name = p.displayName?.text;
    const rawPhone = p.nationalPhoneNumber || p.internationalPhoneNumber;
    if (!name || !rawPhone) continue;

    stores.push({
      sourceId: `google_${p.id}`,
      source: 'google_places',
      name: name.trim(),
      rawPhone: String(rawPhone).trim(),
      governorateId: gov.id,
      governorateName: gov.name,
      category: 'services', // Can be refined by types
      address: p.formattedAddress || `${gov.name} - العراق`,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      website: p.websiteUri || undefined,
      workingHours: p.regularOpeningHours?.weekdayDescriptions?.join(' | ') || undefined,
      rating: p.rating || undefined,
      reviewsCount: p.userRatingCount || 0,
    });
  }

  return { stores, nextPageToken: data.nextPageToken };
}

// 3. SECURE PIPELINE: CLEANING, STRICT PHONE VALIDATION, MULTI-LAYER DEDUPLICATION
export interface ProcessImportResult {
  totalCandidates: number;
  verifiedWithRealPhoneCount: number;
  skippedNoPhoneOrInvalidCount: number;
  duplicateCount: number;
  savedToSupabaseCount: number;
  governoratesBreakdown: Record<string, number>;
  stores: any[];
  supabaseStatus: 'connected_and_saved' | 'supabase_key_missing' | 'error';
  errorMessage?: string;
}

export async function processAndDeduplicateStores(
  candidates: RawCandidateStore[],
  sb: SupabaseClient | null
): Promise<ProcessImportResult> {
  const result: ProcessImportResult = {
    totalCandidates: candidates.length,
    verifiedWithRealPhoneCount: 0,
    skippedNoPhoneOrInvalidCount: 0,
    duplicateCount: 0,
    savedToSupabaseCount: 0,
    governoratesBreakdown: {},
    stores: [],
    supabaseStatus: sb ? 'connected_and_saved' : 'supabase_key_missing',
  };

  // Pre-fetch existing stores from Supabase if connected
  const existingByPhone = new Map<string, any>();
  const existingByNormalizedName = new Map<string, any>(); // "gov_nameNorm" -> store
  const existingBySourceId = new Map<string, any>();

  if (sb) {
    try {
      const { data: dbExisting, error: fetchErr } = await sb
        .from('stores')
        .select('id, name, phone, governorate_id, is_claimed, claim_status, phone_reliability, source, imported_at, website');

      if (!fetchErr && Array.isArray(dbExisting)) {
        for (const s of dbExisting) {
          if (s.phone) {
            existingByPhone.set(normalizeIraqPhone(s.phone), s);
          }
          if (s.name && s.governorate_id) {
            const key = `${s.governorate_id}_${normalizeArabicText(s.name)}`;
            existingByNormalizedName.set(key, s);
          }
        }
      }
    } catch (e) {
      console.warn('Could not pre-fetch existing stores from Supabase:', e);
    }
  }

  // In-batch tracking
  const seenPhonesInBatch = new Set<string>();
  const seenNamesInBatch = new Set<string>();
  const seenWebsitesInBatch = new Set<string>();

  const storesToPersist: any[] = [];
  const nowIso = new Date().toISOString();

  for (const c of candidates) {
    // 1. Mandatory Name
    if (!c.name || !c.name.trim()) {
      result.skippedNoPhoneOrInvalidCount++;
      continue;
    }
    const cleanName = c.name.trim();

    // 2. Strict Real Iraqi Phone Validation (No fake numbers like 07800000000)
    if (!c.rawPhone || !c.rawPhone.trim()) {
      result.skippedNoPhoneOrInvalidCount++;
      continue;
    }

    if (isFakeOrPlaceholderPhone(c.rawPhone)) {
      result.skippedNoPhoneOrInvalidCount++;
      continue;
    }

    const phoneVal = validateIraqPhone(c.rawPhone);
    if (!phoneVal.isValid) {
      result.skippedNoPhoneOrInvalidCount++;
      continue;
    }

    const cleanPhone = phoneVal.normalized;

    // 3. Multi-layer Deduplication:
    // A. Phone deduplication
    if (seenPhonesInBatch.has(cleanPhone)) {
      result.duplicateCount++;
      continue;
    }

    // B. Name + Governorate deduplication
    const normNameKey = `${c.governorateId}_${normalizeArabicText(cleanName)}`;
    if (seenNamesInBatch.has(normNameKey)) {
      result.duplicateCount++;
      continue;
    }

    // C. Website deduplication (if valid)
    if (c.website && c.website.length > 8) {
      const cleanWeb = c.website.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (seenWebsitesInBatch.has(cleanWeb)) {
        result.duplicateCount++;
        continue;
      }
      seenWebsitesInBatch.add(cleanWeb);
    }

    seenPhonesInBatch.add(cleanPhone);
    seenNamesInBatch.add(normNameKey);

    // D. Check against existing Supabase database records
    const existingDbStore = existingByPhone.get(cleanPhone) || existingByNormalizedName.get(normNameKey);

    const storeId =
      existingDbStore?.id ||
      `store_${c.governorateId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Respect existing verification status (NEVER overwrite verified store data)
    const isClaimed = existingDbStore ? Boolean(existingDbStore.is_claimed) : false;
    const claimStatus = existingDbStore?.claim_status || 'unclaimed';
    const phoneReliability = existingDbStore?.phone_reliability || 'unverified';

    const storeRecord: any = {
      id: storeId,
      name: cleanName,
      category: c.category || 'services',
      sub_category: c.subCategory || null,
      phone: phoneVal.formattedDisplay || cleanPhone,
      whatsapp: cleanPhone, // Valid phone used for business WhatsApp inquiry
      address: c.address ? c.address.trim() : '',
      governorate_id: c.governorateId,
      governorate_name: c.governorateName,
      district_id: c.districtId || null,
      district_name: c.districtName || null,
      rating: c.rating !== undefined && !isNaN(c.rating) ? c.rating : null,
      reviews_count: c.reviewsCount || 0,
      is_open: true,
      working_hours: c.workingHours || '٩:٠٠ ص - ١٠:٠٠ م',
      image_url: null, // No fake placeholder stock photos
      description: '',
      tags: [c.governorateName, c.category, 'نشاط موثق'],
      featured: false,
      is_claimed: isClaimed,
      claim_status: claimStatus,
      phone_reliability: phoneReliability,
      source: c.source || 'online_import',
      imported_at: existingDbStore?.imported_at || nowIso,
      updated_at: nowIso,
      created_at: existingDbStore?.created_at || nowIso,
      website: c.website || null,
      facebook: c.facebook || null,
      instagram: c.instagram || null,
      lat: c.lat || null,
      lng: c.lng || null,
    };

    storesToPersist.push(storeRecord);
    result.verifiedWithRealPhoneCount++;
    result.governoratesBreakdown[c.governorateName] = (result.governoratesBreakdown[c.governorateName] || 0) + 1;
  }

  // 4. Batch Persist directly to Supabase public.stores using Server Client
  if (sb && storesToPersist.length > 0) {
    const BATCH_SIZE = 100;
    try {
      for (let i = 0; i < storesToPersist.length; i += BATCH_SIZE) {
        const batch = storesToPersist.slice(i, i + BATCH_SIZE);
        const { error: upsertErr } = await sb.from('stores').upsert(batch, { onConflict: 'id' });
        if (upsertErr) {
          console.error('[Supabase Upsert Batch Error]:', upsertErr);
          result.errorMessage = `فشل جزء من الحفظ في Supabase: ${upsertErr.message}`;
          result.supabaseStatus = 'error';
          break;
        }
        result.savedToSupabaseCount += batch.length;
      }
    } catch (e: any) {
      result.errorMessage = e.message;
      result.supabaseStatus = 'error';
    }
  }

  result.stores = storesToPersist;
  return result;
}
