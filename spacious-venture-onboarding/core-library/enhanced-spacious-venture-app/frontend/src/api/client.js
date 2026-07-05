const API_BASE = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_BASE)
  ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')
  : (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE
    ? String(process.env.VITE_API_BASE).replace(/\/$/, '')
    : (typeof window !== 'undefined' && window.location && window.location.origin
      ? `${String(window.location.origin).replace(/\/$/, '')}/api`
      : ''));

export async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options && options.method ? options.method : 'GET',
    headers: options && options.headers ? options.headers : {},
    body: options && options.body ? options.body : undefined
  });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  return { ok: response.ok, status: response.status, data };
}
