// Centralized API configuration.
// The backend server listens on PORT from .env (currently 5055).
// Override the base URL at build time with VITE_API_URL if you ever
// move the server or deploy. Keeping this in ONE place prevents the
// frontend/backend port drift that broke API calls (5055 vs 5055).
export const API_BASE = (
  (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://127.0.0.1:5055'
);
export const API = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
export default API_BASE;
