import { CityNews } from '../types/directory';
import { IRAQ_GOVERNORATES } from '../data/governorates';

export interface LiveNewsOptions {
  governorateId?: string;
  districtName?: string;
  forceRefresh?: boolean;
  limit?: number;
}

// Memory Cache with 15-minute TTL
interface CacheEntry {
  timestamp: number;
  data: CityNews[];
}

const newsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchLiveNews(options: LiveNewsOptions = {}): Promise<CityNews[]> {
  const { governorateId, districtName, forceRefresh = false, limit = 10 } = options;
  const cacheKey = `${governorateId || 'all'}-${districtName || 'all'}`;

  if (!forceRefresh && newsCache.has(cacheKey)) {
    const cached = newsCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  let query = 'العراق';
  if (governorateId && governorateId !== 'all') {
    const gov = IRAQ_GOVERNORATES.find(g => g.id === governorateId);
    if (gov) query = gov.name;
  }
  if (districtName) {
    query += ` ${districtName}`;
  }

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=IQ&ceid=IQ:ar`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('فشل في جلب الأخبار');
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, limit);

    const newsList: CityNews[] = items.map((item, index) => {
      const title = item.querySelector('title')?.textContent || 'خبر بدون عنوان';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const source = item.querySelector('source')?.textContent || 'مصدر إخباري';

      return {
        id: `news-${Date.now()}-${index}`,
        title,
        summary: title,
        url: link,
        source,
        publishedAt: new Date(pubDate).toLocaleDateString('ar-IQ'),
        governorateId: governorateId || 'all'
      };
    });

    newsCache.set(cacheKey, { timestamp: Date.now(), data: newsList });
    return newsList;

  } catch (error) {
    console.error('Error fetching live news:', error);
    return [];
  }
}
