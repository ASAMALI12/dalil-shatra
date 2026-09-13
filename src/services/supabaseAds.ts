import { ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';

export interface Advertisement {
  id: string;
  title: string;
  subtitle?: string;
  storeId?: string;
  imageUrl?: string;
  linkUrl?: string;
  badge?: string;
  position: 'home_banner' | 'category_banner' | 'popup';
  governorateId?: string;
  districtId?: string;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
}

export async function fetchAdsFromSupabase(position = 'home_banner'): Promise<Advertisement[]> {
  try {
    const client = await ensureSupabaseClient();
    if (getIsSupabaseConfigured()) {
      const { data, error } = await client
        .from('advertisements')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          subtitle: item.subtitle,
          storeId: item.store_id,
          imageUrl: item.image_url,
          linkUrl: item.link_url,
          badge: item.badge,
          position: item.position || 'home_banner',
          governorateId: item.governorate_id,
          districtId: item.district_id,
          isActive: Boolean(item.is_active),
          startsAt: item.starts_at,
          expiresAt: item.expires_at,
        }));
      }
    }

    const res = await fetch(`/api/advertisements?position=${encodeURIComponent(position)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.advertisements)) {
        return json.advertisements;
      }
    }
  } catch (err) {
    console.warn('Could not fetch advertisements:', err);
  }

  return [];
}
