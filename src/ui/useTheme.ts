'use client';
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'daily-flow-theme';

export function resolveInitialTheme(
  saved: string | null,
  prefersDark: boolean,
): Theme {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersDark ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = (() => {
      try {
        return window.localStorage.getItem(KEY);
      } catch {
        return null;
      }
    })();
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const initial = resolveInitialTheme(saved, prefersDark);
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
