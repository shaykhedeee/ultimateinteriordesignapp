export function backendAssetSrc(url) {
  if (!url) return '';
  if (typeof window !== 'undefined' && url.startsWith('/storage')) {
    return new URL(url, window.location.origin).toString();
  }
  return url;
}

export function getApiBase() {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process?.env?.VITE_API_BASE) {
    return process.env.VITE_API_BASE.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window?.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/api`;
  }
  return new URL('/api', 'http://127.0.0.1:5055').toString().replace(/\/$/, '');
}

export function apiUrl(path) {
  const base = getApiBase();
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeoutMs || 60000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`API ${response.status}: ${text || response.statusText}`);
    }
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
}
