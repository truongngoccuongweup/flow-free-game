'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'daily-flow-feedback';

export function readFeedbackEnabled(saved: string | null): boolean {
  return saved !== 'off'; // default ON
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function useFeedbackPrefs() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      setEnabled(readFeedbackEnabled(window.localStorage.getItem(KEY)));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(KEY, next ? 'on' : 'off'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { enabled, toggle };
}
