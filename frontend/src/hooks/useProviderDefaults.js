import { getApiBase } from '../utils/api.js';
import { useState, useEffect } from 'react';

export function useProviderDefaults() {
  const [defaults, setDefaults] = useState({ defaultProvider: 'huggingface', defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0', freeProvidersFirst: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${getApiBase()}/api/settings/defaults`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (!cancelled && data?.success) setDefaults({ defaultProvider: data.settings?.defaultProvider, defaultModel: data.settings?.defaultModel, freeProvidersFirst: !!data.settings?.freeProvidersFirst });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { defaults, loading };
}
