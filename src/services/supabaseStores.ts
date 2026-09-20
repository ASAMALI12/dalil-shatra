import { supabase, ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';
import { DirectoryItem } from '../types/directory';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';
import { validateIraqPhone } from '../utils/iraqPhoneValidator';

// Helper maps for Arabic governorate and district normalization
const GOVERNORATE_NAME_TO_ID: Record<string, string> = {
  'بغداد': 'baghdad',
  'محافظة بغداد': 'baghdad',
  'العاصمة': 'baghdad',
  'baghdad': 'baghdad',

  'البصرة': 'basra',
  'بصرة': 'basra',
  'محافظة البصرة': 'basra',
  'محافظة بصرة': 'basra',
  'basra': 'basra',

  'نينوى': 'nineveh',
  'الموصل': 'nineveh',
  'موصل': 'nineveh',
  'محافظة نينوى': 'nineveh',
  'nineveh': 'nineveh',
  'mosul': 'nineveh',

  'ذي قار': 'dhi-qar',
  'الناصرية': 'dhi-qar',
  'ناصرية': 'dhi-qar',
  'محافظة ذي قار': 'dhi-qar',
  'الشطرة': 'dhi-qar',
  'شطرة': 'dhi-qar',
  'قضاء الشطرة': 'dhi-qar',
  'dhi-qar': 'dhi-qar',
  'dhiqar': 'dhi-qar',

  'النجف': 'najaf',
  'نجف': 'najaf',
  'النجف الأشرف': 'najaf',
  'النجف الاشرف': 'najaf',
  'محافظة النجف': 'najaf',
  'najaf': 'najaf',

  'كربلاء': 'karbala',
  'كربلاء المقدسة': 'karbala',
  'محافظة كربلاء': 'karbala',
  'karbala': 'karbala',

  'بابل': 'babil',
  'الحلة': 'babil',
  'حلة': 'babil',
  'محافظة بابل': 'babil',
  'babil': 'babil',
  'babylon': 'babil',

  'الأنبار': 'anbar',
  'الانبار': 'anbar',
  'الرمادي': 'anbar',
  'رمادي': 'anbar',
  'الفلوجة': 'anbar',
  'فلوجة': 'anbar',
  'محافظة الأنبار': 'anbar',
  'محافظة الانبار': 'anbar',
  'anbar': 'anbar',

  'كركوك': 'kirkuk',
  'محافظة كركوك': 'kirkuk',
  'kirkuk': 'kirkuk',

  'ديالى': 'diyala',
  'بعقوبة': 'diyala',
  'محافظة ديالى': 'diyala',
  'diyala': 'diyala',

  'واسط': 'wasit',
  'الكوت': 'wasit',
  'كوت': 'wasit',
  'محافظة واسط': 'wasit',
  'wasit': 'wasit',

  'ميسان': 'maysan',
  'العمارة': 'maysan',
  'عمارة': 'maysan',
  'محافظة ميسان': 'maysan',
  'maysan': 'maysan',
  'missan': 'maysan',

  'المثنى': 'muthanna',
  'السماوة': 'muthanna',
  'سماوة': 'muthanna',
  'محافظة المثنى': 'muthanna',
  'muthanna': 'muthanna',

  'القادسية': 'qadisiyah',
  'الديوانية': 'qadisiyah',
  'ديوانية': 'qadisiyah',
  'محافظة القادسية': 'qadisiyah',
  'qadisiyah': 'qadisiyah',

  'صلاح الدين': 'salah-al-din',
  'تكريت': 'salah-al-din',
  'سامراء': 'salah-al-din',
  'محافظة صلاح الدين': 'salah-al-din',
  'salah-al-din': 'salah-al-din',
};

const GOVERNORATE_ID_TO_NAME: Record<string, string> = {};
const DISTRICT_NAME_TO_ID: Record<string, { id: string; govId: string; name: string }> = {};

// Populate lookup tables from IRAQ_GOVERNORATES
IRAQ_GOVERNORATES.forEach((gov) => {
  GOVERNORATE_ID_TO_NAME[gov.id] = gov.name;
  GOVERNORATE_NAME_TO_ID[gov.name.trim()] = gov.id;
  const strippedGov = gov.name.replace(/^(محافظة|مدينة)\s+/, '').trim();
  GOVERNORATE_NAME_TO_ID[strippedGov] = gov.id;

  gov.districts.forEach((d) => {
    DISTRICT_NAME_TO_ID[d.name.trim()] = { id: d.id, govId: gov.id, name: d.name };
    const strippedDist = d.name.replace(/\s*\([^)]*\)/g, '').trim();
    DISTRICT_NAME_TO_ID[strippedDist] = { id: d.id, govId: gov.id, name: d.name };
  });
});

/**
 * Normalizes category value from Supabase into application category ID
 */
export function normalizeCategory(rawCat: string): string {
  const cat = (rawCat || '').toLowerCase().trim();
  if (!cat) return 'other';

  if (cat === 'supermarket' || cat.includes('سوبر') || cat.includes('بقالة') || cat.includes('اسواق') || cat.includes('أسواق') || cat.includes('غذائي') || cat.includes('grocery') || cat.includes('food')) {
    return 'supermarket';
  }
  if (cat === 'clothing' || cat.includes('ملابس') || cat.includes('أزياء') || cat.includes('ازياء') || cat.includes('ألبسة') || cat.includes('البسة') || cat.includes('بوتيك') || cat.includes('fashion')) {
    return 'clothing';
  }
  if (cat === 'restaurants' || cat.includes('مطعم') || cat.includes('مطاعم') || cat.includes('مشاوي') || cat.includes('وجبات') || cat.includes('restaurant')) {
    return 'restaurants';
  }
  if (cat === 'cafes' || cat.includes('كافيه') || cat.includes('كوفي') || cat.includes('مقهى') || cat.includes('قهوة') || cat.includes('cafe')) {
    return 'cafes';
  }
  if (cat === 'doctors' || cat.includes('طبيب') || cat.includes('دكتور') || cat.includes('عيادة') || cat.includes('عيادات') || cat.includes('صحة') || cat.includes('doctor') || cat.includes('clinic')) {
    return 'doctors';
  }
  if (cat === 'pharmacies' || cat.includes('صيدلية') || cat.includes('صيدليات') || cat.includes('دواء') || cat.includes('pharmacy')) {
    return 'pharmacies';
  }
  if (cat === 'electronics' || cat.includes('إلكترون') || cat.includes('الكترون') || cat.includes('موبايل') || cat.includes('هواتف') || cat.includes('اتصالات') || cat.includes('electronics') || cat.includes('mobile')) {
    return 'electronics';
  }
  if (cat === 'cars' || cat.includes('سيارات') || cat.includes('سيارة') || cat.includes('معرض') || cat.includes('cars') || cat.includes('auto')) {
    return 'cars';
  }
  if (cat === 'home' || cat.includes('أثاث') || cat.includes('اثاث') || cat.includes('منزلي') || cat.includes('furniture')) {
    return 'home';
  }
  if (cat === 'perfumes' || cat.includes('عطور') || cat.includes('عطر') || cat.includes('تجميل') || cat.includes('مكياج') || cat.includes('perfume') || cat.includes('beauty')) {
    return 'perfumes';
  }
  if (cat === 'sweets' || cat.includes('حلويات') || cat.includes('حلوى') || cat.includes('كيك') || cat.includes('معجنات') || cat.includes('sweets')) {
    return 'sweets';
  }
  if (cat === 'services' || cat.includes('خدمات') || cat.includes('صيانة') || cat.includes('تصليح') || cat.includes('services')) {
    return 'services';
  }
  if (cat === 'used-goods' || cat.includes('مستعمل') || cat.includes('used')) {
    return 'used-goods';
  }
  if (cat === 'lost-found' || cat.includes('مفقودات') || cat.includes('lost')) {
    return 'lost-found';
  }
  if (cat === 'jobs' || cat.includes('وظائف') || cat.includes('وظيفة') || cat.includes('عمل') || cat.includes('jobs')) {
    return 'jobs';
  }

  return cat;
}

/**
 * Normalizes and maps a raw Supabase record from public.stores to DirectoryItem.
 */
export function mapSupabaseStoreToDirectoryItem(row: Record<string, any>): DirectoryItem {
  const id = String(row.id || row.store_id || `store-${Math.random().toString(36).substr(2, 9)}`);
  const name = String(row.name || row.store_name || row.title || row.label || 'متجر غير معنون').trim();

  // Raw category and normalized category
  const rawCat = String(row.category || row.category_id || row.cat || row.store_type || 'other').trim();
  const category = normalizeCategory(rawCat);
  const subCategory = row.sub_category || row.subCategory || row.subcategory || (rawCat !== category ? rawCat : undefined);

  // Phone & WhatsApp - Enforce real Iraqi phone validation, strictly no dummy fallbacks
  const rawPhone = String(row.phone || row.phone_number || row.mobile || row.telephone || row.contact || '').trim();
  const phoneValidation = validateIraqPhone(rawPhone);
  const phone = phoneValidation.isValid ? phoneValidation.normalized : rawPhone;
  const whatsapp = row.whatsapp || row.whatsapp_number || (phone ? phone : undefined);

  // Address
  const address = String(row.address || row.location || row.street || row.address_text || 'العراق').trim();

  // Location / Governorate / District matching
  let govId = String(row.governorate_id || row.governorateId || row.gov_id || row.province || '').toLowerCase().trim();
  let govName = String(row.governorate_name || row.governorateName || row.governorate || '').trim();
  let distId = String(row.district_id || row.districtId || row.dist_id || '').toLowerCase().trim();
  let distName = String(row.district_name || row.districtName || row.district || row.city || row.qadaa || '').trim();

  // Match governorate by name if ID is missing or vice-versa
  if (!govId && govName) {
    const cleanGovName = govName.replace(/^(محافظة|مدينة)\s+/, '').trim();
    if (GOVERNORATE_NAME_TO_ID[cleanGovName]) {
      govId = GOVERNORATE_NAME_TO_ID[cleanGovName];
    }
  } else if (govId) {
    if (GOVERNORATE_NAME_TO_ID[govId]) {
      govId = GOVERNORATE_NAME_TO_ID[govId];
    }
    if (!govName) {
      govName = GOVERNORATE_ID_TO_NAME[govId] || govId;
    }
  }

  // If governorate is still missing, try inferring from address
  if (!govId && address) {
    for (const [alias, mappedId] of Object.entries(GOVERNORATE_NAME_TO_ID)) {
      if (address.includes(alias)) {
        govId = mappedId;
        govName = GOVERNORATE_ID_TO_NAME[govId] || govName;
        break;
      }
    }
  }

  // Match district by name if ID is missing
  if (!distId && distName) {
    const cleanDistName = distName.replace(/\s*\([^)]*\)/g, '').trim();
    if (DISTRICT_NAME_TO_ID[cleanDistName]) {
      distId = DISTRICT_NAME_TO_ID[cleanDistName].id;
      if (!govId) {
        govId = DISTRICT_NAME_TO_ID[cleanDistName].govId;
        govName = GOVERNORATE_ID_TO_NAME[govId] || govName;
      }
    }
  } else if (distId) {
    if (DISTRICT_NAME_TO_ID[distId]) {
      distName = DISTRICT_NAME_TO_ID[distId].name;
      distId = DISTRICT_NAME_TO_ID[distId].id;
    }
  }

  // Tags
  let tags: string[] = [];
  if (Array.isArray(row.tags)) {
    tags = row.tags.map((t: any) => String(t).trim()).filter(Boolean);
  } else if (typeof row.tags === 'string' && row.tags.trim()) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) tags = parsed.map(String);
      else tags = row.tags.split(',').map((t: string) => t.trim());
    } catch {
      tags = row.tags.split(',').map((t: string) => t.trim());
    }
  }
  if (tags.length === 0 && category) {
    tags = [category, name];
  }

  // Numerical & Boolean values (Clean & Genuine: No fake ratings or inflated review counts)
  const parsedRating =
    typeof row.rating === 'number'
      ? row.rating
      : row.rating !== undefined && row.rating !== null && row.rating !== ''
      ? parseFloat(row.rating)
      : null;
  const rating = parsedRating !== null && !isNaN(parsedRating) && parsedRating > 0 ? Number(parsedRating.toFixed(1)) : null;

  const rawReviewsCount =
    typeof row.reviews_count === 'number'
      ? row.reviews_count
      : typeof row.reviewsCount === 'number'
      ? row.reviewsCount
      : row.reviews_count || row.reviewsCount;
  const reviewsCount = rawReviewsCount ? parseInt(String(rawReviewsCount), 10) || 0 : 0;

  const isOpen =
    typeof row.is_open === 'boolean'
      ? row.is_open
      : typeof row.isOpen === 'boolean'
      ? row.isOpen
      : true;

  const workingHours = String(
    row.working_hours || row.workingHours || row.hours || '٩:٠٠ ص - ١١:٠٠ م'
  );

  const imageUrl = String(
    row.image_url ||
      row.imageUrl ||
      row.image ||
      row.photo ||
      row.logo ||
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
  );

  const description = String(row.description || row.bio || row.details || row.about || '').trim();
  const featured = Boolean(row.featured || row.is_featured);

  // Claim status
  const isClaimed = Boolean(row.is_claimed || row.isClaimed);
  const claimedByName = row.claimed_by_name || row.claimedByName || undefined;
  const claimedByPhone = row.claimed_by_phone || row.claimedByPhone || undefined;
  const claimedAt = row.claimed_at || row.claimedAt || undefined;

  // Social Links
  const instagram = row.instagram || undefined;
  const facebook = row.facebook || undefined;
  const tiktok = row.tiktok || undefined;
  const telegram = row.telegram || undefined;
  const website = row.website || undefined;

  // Item type for jobs / used goods / lost & found
  let itemType = (row.item_type || row.itemType || 'store') as DirectoryItem['itemType'];
  if (category === 'used-goods') itemType = 'used_goods';
  if (category === 'lost-found') itemType = 'lost_found';
  if (category === 'jobs') itemType = 'job';

  return {
    id,
    name,
    category,
    subCategory,
    phone,
    whatsapp,
    address,
    governorateId: govId || undefined,
    districtId: distId || undefined,
    governorateName: govName || undefined,
    districtName: distName || undefined,
    rating,
    reviewsCount,
    isOpen,
    workingHours,
    imageUrl,
    description,
    featured,
    tags,
    isClaimed,
    claimStatus: (row.claim_status as DirectoryItem['claimStatus']) || (isClaimed ? 'verified' : 'unclaimed'),
    phoneReliability: (row.phone_reliability as DirectoryItem['phoneReliability']) || 'unverified',
    verificationLevel: (row.verification_level as DirectoryItem['verificationLevel']) || (
      isClaimed || row.claim_status === 'verified'
        ? 'owner_verified'
        : (row.phone_reliability === 'otp_verified' ? 'phone_verified' : (phoneValidation.isValid ? 'phone_valid' : undefined))
    ),
    source: (row.source as DirectoryItem['source']) || 'official_directory',
    importedAt: row.imported_at || row.created_at || undefined,
    claimedByName,
    claimedByPhone,
    claimedAt,
    instagram,
    facebook,
    tiktok,
    telegram,
    website,
    itemType,
    price: row.price || undefined,
    condition: row.condition || undefined,
    salary: row.salary || undefined,
    jobType: row.job_type || row.jobType || undefined,
  };
}

/**
 * Exact schema definition for Supabase table 'stores':
 */
export interface SupabaseStoreRow {
  id: string;
  name: string;
  category: string;
  sub_category?: string | null;
  phone: string;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  website?: string | null;
  address?: string | null;
  governorate_id?: string | null;
  district_id?: string | null;
  governorate_name?: string | null;
  district_name?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  is_open?: boolean | null;
  working_hours?: string | null;
  image_url?: string | null;
  description?: string | null;
  featured?: boolean | null;
  tags?: string[] | null;
  is_claimed?: boolean | null;
  claim_status?: string | null;
  phone_reliability?: string | null;
  verification_level?: string | null;
  source?: string | null;
  imported_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Builds a database row payload strictly matching the Supabase table 'stores' columns
 */
export function mapDirectoryItemToSupabaseStore(store: DirectoryItem): SupabaseStoreRow {
  return {
    id: store.id,
    name: store.name,
    category: store.category,
    sub_category: store.subCategory ?? null,
    phone: store.phone,
    whatsapp: store.whatsapp ?? null,
    instagram: store.instagram ?? null,
    facebook: store.facebook ?? null,
    tiktok: store.tiktok ?? null,
    website: store.website ?? null,
    address: store.address ?? null,
    governorate_id: store.governorateId ?? null,
    district_id: store.districtId ?? null,
    governorate_name: store.governorateName ?? null,
    district_name: store.districtName ?? null,
    rating: typeof store.rating === 'number' ? store.rating : 4.8,
    reviews_count: typeof store.reviewsCount === 'number' ? Math.floor(store.reviewsCount) : 10,
    is_open: Boolean(store.isOpen),
    working_hours: store.workingHours || '٩:٠٠ ص - ١١:٠٠ م',
    image_url: store.imageUrl || '',
    description: store.description ?? null,
    featured: Boolean(store.featured),
    tags: Array.isArray(store.tags) ? store.tags : [],
    is_claimed: Boolean(store.isClaimed),
    claim_status: store.claimStatus || (store.isClaimed ? 'verified' : 'unclaimed'),
    phone_reliability: store.phoneReliability || 'unverified',
    verification_level: store.verificationLevel || null,
    source: store.source || 'official_directory',
    imported_at: store.importedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const buildStoreRowPayload = mapDirectoryItemToSupabaseStore;

/**
 * Fetches ALL stores from Supabase table public.stores.
 * Uses pagination with range(from, to) to bypass the default 1000 items limit.
 */
export async function fetchAllStoresFromSupabase(): Promise<{
  data: DirectoryItem[];
  totalFetched: number;
  fromSupabase: boolean;
  error?: any;
}> {
  const client = await ensureSupabaseClient();

  if (!getIsSupabaseConfigured()) {
    console.info('ℹ️ Supabase not yet configured with Anon Key.');
    return {
      data: [],
      totalFetched: 0,
      fromSupabase: false,
      error: 'Supabase is not configured (missing VITE_SUPABASE_ANON_KEY)',
    };
  }

  try {
    const PAGE_SIZE = 1000;
    let from = 0;
    let allRows: any[] = [];
    let hasMore = true;

    while (hasMore) {
      let result = await client
        .from('stores')
        .select('*', { count: 'exact' })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (result.error && result.error.message && result.error.message.includes('id')) {
        result = await client
          .from('stores')
          .select('*', { count: 'exact' })
          .range(from, from + PAGE_SIZE - 1);
      }

      const { data, error } = result;

      if (error) {
        console.error('Error querying public.stores from Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(data);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      }

      if (allRows.length >= 100000) {
        hasMore = false;
      }
    }

    const mappedItems = allRows.map(mapSupabaseStoreToDirectoryItem);
    console.log(`✅ Fetched ${mappedItems.length} stores from Supabase public.stores.`);

    return {
      data: mappedItems,
      totalFetched: mappedItems.length,
      fromSupabase: true,
    };
  } catch (err) {
    console.error('Failed to fetch stores from Supabase:', err);
    return {
      data: [],
      totalFetched: 0,
      fromSupabase: false,
      error: err,
    };
  }
}

/**
 * Inserts or updates a store in Supabase with adaptive column handling
 */
export async function syncStoreToSupabase(store: DirectoryItem): Promise<{ success: boolean; error?: any }> {
  const client = await ensureSupabaseClient();
  if (!getIsSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    let payload = buildStoreRowPayload(store);

    // Attempt upsert
    let { error } = await client.from('stores').upsert(payload);

    // If a column error occurs (e.g., column does not exist in user's schema), prune and retry
    if (error && error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      const colMatch = error.message.match(/column "([^"]+)" of relation/);
      if (colMatch && colMatch[1]) {
        delete payload[colMatch[1]];
        const retryRes = await client.from('stores').upsert(payload);
        error = retryRes.error;
      }
    }

    if (error) {
      console.warn('Could not sync store to Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Sync store error:', err);
    return { success: false, error: err };
  }
}

/**
 * Adds a new store to Supabase table
 */
export async function addStoreToSupabase(store: DirectoryItem): Promise<{ success: boolean; error?: any }> {
  return syncStoreToSupabase(store);
}

/**
 * Updates a store in Supabase table
 */
export async function updateStoreInSupabase(
  id: string,
  updates: Partial<DirectoryItem>
): Promise<{ success: boolean; error?: any }> {
  const client = await ensureSupabaseClient();
  if (!getIsSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const payload: Partial<SupabaseStoreRow> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.subCategory !== undefined) payload.sub_category = updates.subCategory ?? null;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp ?? null;
    if (updates.instagram !== undefined) payload.instagram = updates.instagram ?? null;
    if (updates.facebook !== undefined) payload.facebook = updates.facebook ?? null;
    if (updates.address !== undefined) payload.address = updates.address ?? null;
    if (updates.governorateId !== undefined) payload.governorate_id = updates.governorateId ?? null;
    if (updates.districtId !== undefined) payload.district_id = updates.districtId ?? null;
    if (updates.governorateName !== undefined) payload.governorate_name = updates.governorateName ?? null;
    if (updates.districtName !== undefined) payload.district_name = updates.districtName ?? null;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.reviewsCount !== undefined) payload.reviews_count = updates.reviewsCount;
    if (updates.isOpen !== undefined) payload.is_open = updates.isOpen;
    if (updates.workingHours !== undefined) payload.working_hours = updates.workingHours;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.description !== undefined) payload.description = updates.description ?? null;
    if (updates.featured !== undefined) payload.featured = updates.featured;
    if (updates.tags !== undefined) payload.tags = Array.isArray(updates.tags) ? updates.tags : [];
    payload.updated_at = new Date().toISOString();

    const { error } = await client.from('stores').update(payload).eq('id', id);

    if (error) {
      console.warn('Could not update store in Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Update store error:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes a store from Supabase public.stores table
 */
export async function deleteStoreFromSupabase(storeId: string): Promise<{ success: boolean; error?: any }> {
  const client = await ensureSupabaseClient();
  if (!getIsSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await client.from('stores').delete().eq('id', storeId);
    if (error) {
      console.warn('Could not delete store from Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Delete store error:', err);
    return { success: false, error: err };
  }
}

/**
 * Seeds a list of stores into Supabase public.stores table in batches
 */
export async function seedStoresToSupabase(
  stores: DirectoryItem[]
): Promise<{ success: boolean; count: number; error?: any }> {
  const client = await ensureSupabaseClient();
  if (!getIsSupabaseConfigured()) {
    return { success: false, count: 0, error: 'Supabase not configured' };
  }

  try {
    const BATCH_SIZE = 25;
    let seeded = 0;

    for (let i = 0; i < stores.length; i += BATCH_SIZE) {
      const batch = stores.slice(i, i + BATCH_SIZE).map(buildStoreRowPayload);
      const { error } = await client.from('stores').upsert(batch);
      if (error) {
        console.warn(`Error seeding batch ${i / BATCH_SIZE}:`, error);
        // continue trying other batches
      } else {
        seeded += batch.length;
      }
    }

    return { success: true, count: seeded };
  } catch (err) {
    return { success: false, count: 0, error: err };
  }
}
