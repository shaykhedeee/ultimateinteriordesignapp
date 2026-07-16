import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', '..', 'storage', 'settings.json');

const DEFAULT_SETTINGS = {
  updatedAt: new Date().toISOString(),
  defaultProvider: 'huggingface',
  defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0',
  freeProvidersFirst: true,
  maxCostPerImage: 0,
  providers: {
    openrouter: {
      provider: 'openrouter',
      enabled: true,
      endpoint: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.1-70b-instruct:free',
      fallbackOrder: 1,
      capabilities: ['text', 'critic_text', 'image', 'enhance', 'upscale', 'render', 'edit']
    },
    huggingface: {
      provider: 'huggingface',
      enabled: true,
      endpoint: 'https://router.huggingface.co/hf-inference/models',
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      fallbackOrder: 2,
      capabilities: ['text', 'image', 'enhance', 'upscale', 'render', 'edit']
    },
    openai: {
      provider: 'openai',
      enabled: false,
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-image-1',
      fallbackOrder: 3,
      capabilities: ['text', 'image', 'enhance', 'upscale', 'render', 'edit']
    },
    freepik: {
      provider: 'freepik',
      enabled: false,
      endpoint: 'https://api.freepik.com/v1/ai/text-to-image',
      model: 'flux-dev',
      fallbackOrder: 4,
      capabilities: ['text', 'image', 'enhance', 'render', 'edit']
    },
    pexels: {
      provider: 'pexels',
      enabled: true,
      endpoint: 'https://api.pexels.com/v1',
      fallbackOrder: 5,
      capabilities: ['image', 'style_image', 'reference']
    },
    pollinations: {
      provider: 'pollinations',
      enabled: true,
      endpoint: 'https://image.pollinations.ai',
      model: 'flux',
      fallbackOrder: 6,
      capabilities: ['text', 'image', 'enhance', 'upscale', 'render', 'edit']
    },
    mock: {
      provider: 'mock',
      enabled: true,
      endpoint: '',
      model: 'mock',
      fallbackOrder: 99,
      capabilities: ['text', 'image', 'enhance', 'upscale', 'render', 'edit']
    }
  }
};

export function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  settings.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

export function getProviderSetting(providerKey) {
  const settings = loadSettings();
  return settings.providers[providerKey];
}

export function updateProviderSetting(providerKey, patch) {
  const settings = loadSettings();
  const current = settings.providers[providerKey] || { provider: providerKey };
  settings.providers[providerKey] = { ...current, ...patch, provider: providerKey };
  saveSettings(settings);
  return settings.providers[providerKey];
}

export function listProviderSettings() {
  return loadSettings();
}
