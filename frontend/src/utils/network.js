let cachedOffline = null;
export function useOfflineMode() {
  if (cachedOffline !== null) return cachedOffline;
  if (typeof navigator === 'undefined') {
    cachedOffline = { offline: false, readOnly: false, status: 'unknown' };
    return cachedOffline;
  }
  cachedOffline = { offline: !navigator.onLine, readOnly: false, status: navigator.onLine ? 'online' : 'offline' };
  return cachedOffline;
}

export function setOfflineReadOnly(readOnly) {
  cachedOffline = { offline: true, readOnly: Boolean(readOnly), status: 'offline-readonly' };
  return cachedOffline;
}

export function backendReachable(base) {
  if (typeof fetch === 'undefined') return Promise.resolve(false);
  return fetch(`${base}/api/health`, { method: 'GET' })
    .then(res => res.ok)
    .catch(() => false);
}
