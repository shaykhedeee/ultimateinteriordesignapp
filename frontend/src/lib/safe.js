// Safe JSON.parse — never throws. Returns `fallback` for null/undefined/non-string
// or unparseable input. Prevents white-screens from malformed or missing *_json
// columns coming back from the API.
export function safeParse(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Safe wrapper for array-typed JSON columns (walls/openings/parts/etc.)
export function safeParseArray(value) {
  const parsed = safeParse(value, []);
  return Array.isArray(parsed) ? parsed : [];
}
