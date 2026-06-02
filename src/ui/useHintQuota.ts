'use client';
import { useCallback, useEffect, useState } from 'react';
import { dailyDateISO } from '../game/level-repository';

const KEY = 'daily-flow-hints';
const LIMIT = 3;

export function quotaRemaining(saved: string | null, today: string, limit = LIMIT): number {
  try {
    const o = saved ? (JSON.parse(saved) as { date?: string; used?: number }) : null;
    if (o && o.date === today) return Math.max(0, limit - (o.used ?? 0));
  } catch {
    /* corrupt — treat as fresh */
  }
  return limit;
}

export function useHintQuota(limit = LIMIT) {
  const [remaining, setRemaining] = useState(limit);

  useEffect(() => {
    try {
      setRemaining(quotaRemaining(window.localStorage.getItem(KEY), dailyDateISO(new Date()), limit));
    } catch {
      /* storage unavailable */
    }
  }, [limit]);

  const use = useCallback((): boolean => {
    const today = dailyDateISO(new Date());
    let used = 0;
    try {
      const o = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as { date?: string; used?: number } | null;
      used = o && o.date === today ? (o.used ?? 0) : 0;
    } catch {
      used = 0;
    }
    if (used >= limit) {
      setRemaining(0);
      return false;
    }
    const next = used + 1;
    try { window.localStorage.setItem(KEY, JSON.stringify({ date: today, used: next })); } catch { /* ignore */ }
    setRemaining(Math.max(0, limit - next));
    return true;
  }, [limit]);

  return { remaining, use };
}
