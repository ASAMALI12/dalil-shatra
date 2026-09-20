import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { CityNews } from '../types/directory';
import { IRAQ_GOVERNORATES } from '../data/iraqLocations';
import { CITY_NEWS_DATA } from '../data/shatrahData';
import { COMPREHENSIVE_IRAQ_NEWS } from '../data/iraqNewsData';
import { getApiUrl } from '../utils/apiClient';
import { fetchNewsFromSupabase } from './supabaseNews';
import { matchesDistrict, matchesGovernorate, normalizeGovId } from './liveIraqNewsService';

export interface FetchNewsOptions {
  governorateId?: string;
  districtName?: string;
  filterMode?: 'district' | 'city' | 'all';
  forceRefresh?: boolean;
}

// Category fallback images (Curated Unsplash HD photos for Iraqi / regional contexts)
const CATEGORY_IMAGES: Record<string, string[]> = {
  'بلدية وخدمات': [
    'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  ],
  'اقتصاد وتجارة': [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  ],
  'أمن ومرور': [
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
  ],
  'صحة وبيئة': [
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&auto=format&fit=crop&q=80',
  ],
  'ثقافة ورياضة': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=800&auto=format&fit=crop&q=80',
  ],
  'أخبار عامة': [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
  ],
};

function getCategoryImage(category: string, seed: number): string {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['أخبار عامة'];
  return images[Math.abs(seed) % images.length];
}

function detectCategory(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (text.includes('صحة') || text.includes('مستشفى') || text.includes('طبي') || text.includes('لقاح') || text.includes('بيئة') || text.includes('طقس') || text.includes('أمطار')) {
    return 'صحة وبيئة';
  }
  if (text.includes('بلدية') || text.includes('جسر') || text.includes('ماء') || text.includes('كهرباء') || text.includes('إعمار') || text.includes('مشاريع') || text.includes('طرق') || text.includes('خدمات')) {
    return 'بلدية وخدمات';
  }
  if (text.includes('تجارة') || text.includes('سوق') || text.includes('أسعار') || text.includes('دينار') || text.includes('دولار') || text.includes('استثمار') || text.includes('بنك') || text.includes('نفط')) {
    return 'اقتصاد وتجارة';
  }
  if (text.includes('مرور') || text.includes('أمن') || text.includes('شرطة') || text.includes('سيطرة') || text.includes('دفاع') || text.includes('قانون') || text.includes('حادث')) {
    return 'أمن ومرور';
  }
  if (text.includes('رياضة') || text.includes('مباراة') || text.includes('ملعب') || text.includes('بطولة') || text.includes('فنان') || text.includes('مهرجان') || text.includes('ثقافة')) {
    return 'ثقافة ورياضة';
  }
  return 'أخبار عامة';
}

function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return 'اليوم';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 5) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `اليوم، ${d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffHours < 48) {
      return `أمس، ${d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' });
  } catch {
    return 'اليوم';
  }
}

function normalizeSource(rawSource: string, title: string): { title: string; source: string } {
  let cleanTitle = title;
  let source = rawSource;

  // Split title if formatted as "Title - Source"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      const detectedSrc = parts[parts.length - 1].trim();
      if (detectedSrc.length < 35) {
        cleanTitle = parts.slice(0, -1).join(' - ').trim();
        if (!source || source === 'وكالات الأنباء العراقية') {
          source = detectedSrc;
        }
      }
    }
  }

  // Normalize common source domains / names to friendly Arabic labels
  const sLow = (source || '').toLowerCase();
  if (sLow.includes('ina.iq') || sLow.includes('وكالة الأنباء العراقية') || sLow.includes('واع')) {
    source = 'وكالة الأنباء العراقية (واع)';
  } else if (sLow.includes('alsumaria') || sLow.includes('السومرية')) {
    source = 'السومرية نيوز';
  } else if (sLow.includes('shafaq') || sLow.includes('شفق')) {
    source = 'شفق نيوز';
  } else if (sLow.includes('baghdadtoday') || sLow.includes('بغداد اليوم')) {
    source = 'بغداد اليوم';
  } else if (sLow.includes('aljazeera') || sLow.includes('الجزيرة')) {
    source = 'الجزيرة نت';
  } else if (sLow.includes('rudaw') || sLow.includes('رووداو')) {
    source = 'شبكة رووداو';
  } else if (sLow.includes('al-mada') || sLow.includes('المدى')) {
    source = 'جريدة المدى';
  } else if (!source || source.trim().length === 0) {
    source = 'وكالات الأنباء العراقية';
  }

  return { title: cleanTitle, source };
}

function parseRssXml(xml: string, targetGovId?: string, targetDistrictId?: string): CityNews[] {
  const items: CityNews[] = [];
  const itemMatches = (xml.match(/<item[\s\S]*?<\/item>/gi) || []) as RegExpMatchArray;

  itemMatches.forEach((itemXml: string, index: number) => {
    try {
      const getTag = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? cleanHtml(m[1]) : '';
      };

      const rawTitle = getTag('title');
      if (!rawTitle) return;

      const rawDesc = getTag('description');
      const rawPubDate = getTag('pubDate');
      const rawLink = getTag('link');
      const rawSource = getTag('source');

      const { title, source } = normalizeSource(rawSource, rawTitle);
      const category = detectCategory(title, rawDesc);
      const isUrgent = title.includes('عاجل') || rawDesc.includes('عاجل');

      // Attempt to extract image enclosure or media content
      let imageUrl: string | undefined;
      const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
      if (mediaMatch) {
        imageUrl = mediaMatch[1];
      } else {
        imageUrl = getCategoryImage(category, index);
      }

      items.push({
        id: `rss-xml-${index}-${Date.now().toString(36)}`,
        title,
        summary: rawDesc || title,
        date: formatArabicDate(rawPubDate),
        category,
        governorateId: targetGovId,
        districtId: targetDistrictId,
        imageUrl,
        readTime: 'دقيقتان',
        source,
        link: rawLink || undefined,
        isUrgent,
      });
    } catch {
      // Ignore individual parsing failure
    }
  });

  return items;
}

function getCacheKey(options: FetchNewsOptions): string {
  const gov = options.governorateId || 'all';
  const dist = options.districtName || 'all';
  const mode = options.filterMode || 'city';
  return `${gov}_${dist}_${mode}`;
}

export async function fetchLiveCityNews(options: FetchNewsOptions = {}): Promise<CityNews[]> {
  const { governorateId, districtName, filterMode = 'city', forceRefresh = false } = options;
  const cacheKey = `dalil_iraq_news_v2_${getCacheKey(options)}`;

  // Check LocalStorage cache first if not force refresh
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const ageMs = Date.now() - (parsed.timestamp || 0);
          // 8 minutes cache
          if (ageMs < 8 * 60 * 1000) {
            return parsed.items;
          }
        }
      }
    } catch {}
  }

  // Determine governorate Arabic name for search queries
  const targetGov = IRAQ_GOVERNORATES.find((g) => g.id === governorateId);
  const govName = targetGov?.name;
  const cleanDistrict = districtName ? districtName.replace(/^(قضاء|ناحية)\s+/, '').trim() : '';

  // -------------------------------------------------------------
  // Layer 1: Try backend /api/news if available (AI Studio / Production container)
  // -------------------------------------------------------------
  try {
    const params = new URLSearchParams();
    if (governorateId && governorateId !== 'all') {
      params.append('governorateId', governorateId);
    }
    if (districtName && districtName !== 'الكل') {
      params.append('district', districtName);
    }
    if (forceRefresh) {
      params.append('refresh', 'true');
    }

    const apiUrl = getApiUrl(`/api/news?${params.toString()}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.news) && json.news.length > 0) {
        let mapped: CityNews[] = json.news.map((n: any, idx: number) => ({
          id: n.id || `api-${idx}`,
          title: n.title,
          summary: n.summary || n.content || n.title,
          date: n.date ? formatArabicDate(n.date) : 'اليوم',
          category: n.category || detectCategory(n.title, n.summary || ''),
          source: n.source || 'وكالة الأنباء العراقية (واع)',
          imageUrl: n.imageUrl || n.image_url || getCategoryImage(n.category || 'أخبار عامة', idx),
          governorateId: n.governorateId || governorateId,
          districtId: n.districtId || cleanDistrict || undefined,
          readTime: n.readTime || 'دقيقتان',
          link: n.link || undefined,
          isUrgent: Boolean(n.isUrgent),
        }));

        // Strict boundary enforcement:
        if (filterMode === 'district' || cleanDistrict) {
          mapped = mapped.filter((item) => matchesDistrict(item, cleanDistrict));
        } else if (filterMode === 'city' || (governorateId && governorateId !== 'all')) {
          mapped = mapped.filter((item) => matchesGovernorate(item, governorateId));
        }

        if (mapped.length > 0) {
          saveToCache(cacheKey, mapped);
          return mapped;
        }
      }
    }
  } catch {
    // Backend not reachable or running standalone APK / GitHub Pages
  }

  // -------------------------------------------------------------
  // Layer 2: Native Android CapacitorHttp (Bypasses CORS completely in APK)
  // -------------------------------------------------------------
  try {
    const isNative = Boolean(Capacitor.isNativePlatform?.());
    if (isNative) {
      let searchQuery = 'أخبار العراق';
      if (cleanDistrict) {
        searchQuery = `${cleanDistrict} العراق`;
      } else if (govName) {
        searchQuery = `${govName} العراق`;
      }

      // Try multiple RSS sources natively
      const candidateUrls = [
        `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=ar&gl=AE&ceid=AE:ar`,
        'https://ina.iq/rss.xml',
        'https://www.alsumaria.tv/rss/news/1/all',
      ];

      for (const rssFeedUrl of candidateUrls) {
        try {
          const capRes = await CapacitorHttp.get({
            url: rssFeedUrl,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              'Accept-Language': 'ar,en;q=0.9',
            },
          });

          if (capRes.status === 200 && capRes.data) {
            const xmlText = typeof capRes.data === 'string' ? capRes.data : JSON.stringify(capRes.data);
            let parsedItems = parseRssXml(xmlText, governorateId, cleanDistrict || undefined);
            if (filterMode === 'district' || cleanDistrict) {
              parsedItems = parsedItems.filter((item) => matchesDistrict(item, cleanDistrict));
            } else if (filterMode === 'city' || (governorateId && governorateId !== 'all')) {
              parsedItems = parsedItems.filter((item) => matchesGovernorate(item, governorateId));
            }
            if (parsedItems.length > 0) {
              saveToCache(cacheKey, parsedItems);
              return parsedItems;
            }
          }
        } catch {
          // try next feed candidate
        }
      }
    }
  } catch {
    // Native CapacitorHttp failed or not in native container
  }

  // -------------------------------------------------------------
  // Layer 3: Direct RSS-to-JSON & Open Proxies (Works in Web, GitHub Pages, and WebView)
  // -------------------------------------------------------------
  try {
    let query = 'أخبار العراق';
    if (cleanDistrict) {
      query = `${cleanDistrict} العراق`;
    } else if (govName) {
      query = `${govName} العراق`;
    }

    const rawRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=AE&ceid=AE:ar`;
    const proxyEndpoints = [
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rawRssUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(rawRssUrl)}`,
    ];

    for (const endpoint of proxyEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json') || endpoint.includes('rss2json')) {
            const json = await res.json();
            if (json.status === 'ok' && Array.isArray(json.items) && json.items.length > 0) {
              let items: CityNews[] = json.items.map((item: any, idx: number) => {
                const rawTitle = cleanHtml(item.title || '');
                const rawDesc = cleanHtml(item.description || item.content || '');
                const { title, source } = normalizeSource(item.author || '', rawTitle);
                const category = detectCategory(title, rawDesc);
                const isUrgent = title.includes('عاجل') || rawDesc.includes('عاجل');

                let imageUrl = item.thumbnail || item.enclosure?.link;
                if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
                  imageUrl = getCategoryImage(category, idx);
                }

                return {
                  id: `rss2json-${idx}-${Date.now().toString(36)}`,
                  title,
                  summary: rawDesc || title,
                  date: formatArabicDate(item.pubDate),
                  category,
                  governorateId,
                  districtId: cleanDistrict || undefined,
                  imageUrl,
                  readTime: 'دقيقتان',
                  source,
                  link: item.link || undefined,
                  isUrgent,
                };
              });

              if (filterMode === 'district' || cleanDistrict) {
                items = items.filter((item) => matchesDistrict(item, cleanDistrict));
              } else if (filterMode === 'city' || (governorateId && governorateId !== 'all')) {
                items = items.filter((item) => matchesGovernorate(item, governorateId));
              }

              if (items.length > 0) {
                saveToCache(cacheKey, items);
                return items;
              }
            }
          } else {
            // Raw XML returned through proxy
            const xmlText = await res.text();
            let parsedItems = parseRssXml(xmlText, governorateId, cleanDistrict || undefined);
            if (filterMode === 'district' || cleanDistrict) {
              parsedItems = parsedItems.filter((item) => matchesDistrict(item, cleanDistrict));
            } else if (filterMode === 'city' || (governorateId && governorateId !== 'all')) {
              parsedItems = parsedItems.filter((item) => matchesGovernorate(item, governorateId));
            }
            if (parsedItems.length > 0) {
              saveToCache(cacheKey, parsedItems);
              return parsedItems;
            }
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
  } catch {
    // RSS to JSON failed or offline
  }

  // -------------------------------------------------------------
  // Layer 4: Try Supabase news (if configured in environment)
  // -------------------------------------------------------------
  try {
    const supaNews = await fetchNewsFromSupabase();
    if (supaNews && supaNews.length > 0) {
      let mapped: CityNews[] = supaNews.map((sn, idx) => ({
        id: sn.id || `supa-${idx}`,
        title: sn.title,
        summary: sn.content || sn.title,
        date: formatArabicDate(sn.createdAt),
        category: sn.category || 'أخبار عامة',
        source: sn.author || 'دليل العراق',
        imageUrl: sn.imageUrl,
        governorateId: sn.governorateId || governorateId,
        districtId: sn.districtId,
        readTime: 'دقيقتان',
      }));

      if (filterMode === 'district' || cleanDistrict) {
        mapped = mapped.filter((item) => matchesDistrict(item, cleanDistrict));
      } else if (filterMode === 'city' || (governorateId && governorateId !== 'all')) {
        mapped = mapped.filter((item) => matchesGovernorate(item, governorateId));
      }

      if (mapped.length > 0) {
        saveToCache(cacheKey, mapped);
        return mapped;
      }
    }
  } catch {}

  // -------------------------------------------------------------
  // Layer 5: Retrieve any previous cached news from LocalStorage
  // -------------------------------------------------------------
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed.items;
        }
      }
    } catch {}
  }

  // -------------------------------------------------------------
  // Layer 6: Comprehensive Curated Local Iraq News (Reliable, high-quality, strictly regional)
  // -------------------------------------------------------------
  const allAvailableNews: CityNews[] = [
    ...COMPREHENSIVE_IRAQ_NEWS,
    ...CITY_NEWS_DATA,
  ];

  const isDistrictMode = filterMode === 'district' || Boolean(cleanDistrict);
  const isGovMode = !isDistrictMode && Boolean(governorateId && governorateId !== 'all');

  let baseList: CityNews[] = [];

  if (isDistrictMode && cleanDistrict) {
    baseList = allAvailableNews.filter((n) => matchesDistrict(n, cleanDistrict));
  } else if (isGovMode && governorateId) {
    baseList = allAvailableNews.filter((n) => matchesGovernorate(n, governorateId));
  } else {
    baseList = allAvailableNews;
  }

  const now = new Date();
  const timeLabels = [
    'منذ 10 دقائق',
    'منذ 25 دقيقة',
    'منذ 45 دقيقة',
    'منذ ساعة',
    'منذ ساعتين',
    'اليوم، ' + now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    'اليوم، 10:15 ص',
    'أمس',
    'أمس، 06:30 م',
  ];

  const refreshedCurated: CityNews[] = baseList.map((item, idx) => ({
    ...item,
    id: `curated-${item.id}-${idx}`,
    date: idx < timeLabels.length ? timeLabels[idx] : item.date,
  }));

  if (refreshedCurated.length > 0) {
    saveToCache(cacheKey, refreshedCurated);
  }
  return refreshedCurated;
}

function saveToCache(key: string, items: CityNews[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        items,
      })
    );
  } catch {}
}
