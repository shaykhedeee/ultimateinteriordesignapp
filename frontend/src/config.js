// Centralized API configuration.
// The backend server listens on PORT from .env.
// Override the base URL at build time with VITE_API_URL if you ever
// move the server or deploy. Keeping this in ONE place prevents the
// frontend/backend port drift in local and hosted deployments.
export const API_BASE = (
  (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
  ''
);
// Screens use API as a base-string prefix: `${API}/api/...`. For same-origin
// (the normal case) this is '' so requests hit the current origin.
export const API = API_BASE;
export default API_BASE;
