import { useEffect, useRef } from 'react';

export function useAutoClear(value, onClear, delayMs = 2200) {
  const timerRef = useRef(null);
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  useEffect(() => {
    if (value == null) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onClearRef.current) onClearRef.current();
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);
}

export const TOAST_DURATIONS = Object.freeze({
  success: 2200,
  error: 4000,
  loading: Infinity
});
