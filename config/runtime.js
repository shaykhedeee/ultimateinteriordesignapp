const runtimeBase = process.env.ULTIDA_API_BASE || 'http://127.0.0.1:5055';

export function getApiBase() {
  return runtimeBase.replace(/\/$/, '');
}

export function isBrowser() {
  return typeof window !== 'undefined';
}
