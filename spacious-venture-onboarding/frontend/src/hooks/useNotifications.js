import { useState, useCallback, useRef } from 'react';

let nextId = 0;

export function useNotifications() {
  const [toasts, setToasts] = useState([]);
  const ref = useRef(toasts);
  ref.current = toasts;

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => notify(msg, 'success', dur), [notify]);
  const error = useCallback((msg, dur) => notify(msg, 'error', dur), [notify]);
  const warning = useCallback((msg, dur) => notify(msg, 'warning', dur), [notify]);
  const info = useCallback((msg, dur) => notify(msg, 'info', dur), [notify]);

  return { toasts, notify, dismiss, success, error, warning, info };
}
