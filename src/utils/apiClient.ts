/**
 * Centralized API Client & URL Resolver for «دليل العراق»
 * Handles cross-platform URL resolution (Web, Capacitor Android APK, Custom Host)
 */

/**
 * Returns the base API URL depending on the running environment:
 * 1. Explicit environment variable: VITE_API_URL
 * 2. User-configured custom API URL saved in localStorage
 * 3. Capacitor Native Android environment (points to production backend)
 * 4. Browser environment (uses relative URL)
 */
export function getApiBaseUrl(): string {
  // 1. Check Vite env variable
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteApi = (import.meta as any).env.VITE_API_URL;
      if (viteApi && typeof viteApi === 'string' && viteApi.trim().length > 0) {
        return viteApi.replace(/\/+$/, '');
      }
    }
  } catch {}

  // 2. Check localStorage for user/admin override
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('iraq_custom_api_url');
      if (custom && custom.trim().length > 0) {
        return custom.replace(/\/+$/, '');
      }
    } catch {}

    // 3. Detect Capacitor / Android native container
    const isCapacitor =
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.navigator.userAgent.includes('Android'));

    if (isCapacitor) {
      // In native container, relative paths or empty base allows client services & CapacitorHttp to operate
      return '';
    }
  }

  // 4. Default web relative path
  return '';
}

/**
 * Formats an API path with the appropriate host prefix
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}

export interface SafeApiResponse<T = any> {
  success: boolean;
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
  json: () => Promise<T>;
}

/**
 * Enhanced fetch wrapper that prepends the proper base API URL (Web vs Capacitor APK)
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(path), options);
}

/**
 * Safe fetch wrapper with timeout and standardized error handling
 */
export async function safeApiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<SafeApiResponse<T>> {
  const url = getApiUrl(path);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);

    const contentType = res.headers.get('content-type') || '';
    let parsedData: any = null;
    if (contentType.includes('application/json')) {
      parsedData = await res.json();
    } else {
      parsedData = await res.text();
    }

    if (!res.ok) {
      return {
        success: false,
        ok: false,
        status: res.status,
        error: (parsedData && parsedData.error) || (parsedData && parsedData.message) || `HTTP Error ${res.status}`,
        data: parsedData,
        json: async () => parsedData,
      };
    }

    return {
      success: true,
      ok: true,
      status: res.status,
      data: parsedData,
      json: async () => parsedData,
    };
  } catch (err: any) {
    clearTimeout(id);
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout ? 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.' : (err?.message || 'حدث خطأ في الاتصال بالخادم.');
    return {
      success: false,
      ok: false,
      status: isTimeout ? 408 : 500,
      error: errorMsg,
      data: { success: false, error: errorMsg } as any,
      json: async () => ({ success: false, error: errorMsg } as any),
    };
  }
}
