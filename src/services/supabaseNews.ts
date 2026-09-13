import { ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category?: string;
  author?: string;
  governorateId?: string;
  districtId?: string;
  imageUrl?: string;
  createdAt: string;
}

export async function fetchNewsFromSupabase(): Promise<NewsArticle[]> {
  try {
    const client = await ensureSupabaseClient();
    if (getIsSupabaseConfigured()) {
      const { data, error } = await client
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          content: item.content,
          category: item.category,
          author: item.author || 'إدارة دليل العراق',
          governorateId: item.governorate_id,
          districtId: item.district_id,
          imageUrl: item.image_url,
          createdAt: item.created_at || new Date().toISOString(),
        }));
      }
    }

    const res = await fetch('/api/news');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.news)) {
        return json.news;
      }
    }
  } catch (err) {
    console.warn('Could not fetch news:', err);
  }

  return [];
}
