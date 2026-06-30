import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      
      // Don't trigger when focused in inputs/textarea unless it's Escape
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag || '') && key !== 'escape') return;

      let shortcutKey = '';
      if (isMeta && e.shiftKey) shortcutKey = `cmd+shift+${key}`;
      else if (isMeta) shortcutKey = `cmd+${key}`;
      else shortcutKey = key;

      if (shortcuts[shortcutKey]) {
        e.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
