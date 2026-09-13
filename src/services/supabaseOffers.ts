import { supabase, ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';
import { Offer } from '../types/directory';

export interface SupabaseOfferRow {
  id: string;
  store_id?: string | null;
  business_name: string;
  title: string;
  description?: string | null;
  discount_percentage?: string | null;
  coupon_code?: string | null;
  governorate_id?: string | null;
  district_id?: string | null;
  category?: string | null;
  image_url?: string | null;
  valid_until?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

export function mapRowToOffer(row: Record<string, any>): Offer {
  return {
    id: String(row.id || `offer-${Math.random().toString(36).substr(2, 9)}`),
    storeId: row.store_id || row.storeId || undefined,
    businessName: String(row.business_name || row.businessName || 'نشاط تجاري'),
    title: String(row.title || 'عرض خاص'),
    description: String(row.description || ''),
    discountPercentage: row.discount_percentage || row.discountPercentage || 'خصم خاص',
    couponCode: row.coupon_code || row.couponCode || undefined,
    governorateId: row.governorate_id || row.governorateId || undefined,
    districtId: row.district_id || row.districtId || undefined,
    category: row.category || 'restaurants',
    imageUrl: row.image_url || row.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    validUntil: row.valid_until || row.validUntil || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Fetch offers from Supabase or server API
 */
export async function fetchOffersFromSupabase(params?: {
  governorateId?: string;
  districtId?: string;
  category?: string;
}): Promise<{ offers: Offer[]; fromSupabase: boolean; error?: any }> {
  try {
    const client = await ensureSupabaseClient();
    if (getIsSupabaseConfigured()) {
      let query = client.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false });

      if (params?.governorateId && params.governorateId !== 'all') {
        query = query.or(`governorate_id.eq.${params.governorateId},governorate_id.is.null`);
      }
      if (params?.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return {
          offers: data.map(mapRowToOffer),
          fromSupabase: true,
        };
      }
    }

    // Fallback to server API
    const searchParams = new URLSearchParams();
    if (params?.governorateId) searchParams.append('governorateId', params.governorateId);
    if (params?.districtId) searchParams.append('districtId', params.districtId);
    if (params?.category) searchParams.append('category', params.category);

    const res = await fetch(`/api/offers?${searchParams.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.offers)) {
        return { offers: json.offers.map(mapRowToOffer), fromSupabase: false };
      }
    }
  } catch (err) {
    console.warn('Could not fetch offers from Supabase:', err);
  }

  return { offers: [], fromSupabase: false };
}

/**
 * Add a new offer through the secure server endpoint.
 * The server enforces the 15-day notification limit via `offer_notification_limits`
 * and automatically triggers the geo-targeted notification.
 */
export async function submitStoreOffer(offerData: {
  storeId: string;
  businessName: string;
  title: string;
  description: string;
  discountPercentage?: string;
  couponCode?: string;
  governorateId?: string;
  districtId?: string;
  category?: string;
  imageUrl?: string;
}): Promise<{
  success: boolean;
  offer?: Offer;
  notificationCreated?: boolean;
  cooldownRemainingDays?: number;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'تعذر الاتصال بالخادم لإضافة العرض',
    };
  }
}
