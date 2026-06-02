import { describe, it, expect } from 'vitest';
import { emptyStats, isConsecutiveDay, recordDailyWin, hasPlayed, loadStats, saveStats } from './daily-stats';

describe('isConsecutiveDay', () => {
  it('true only for the immediate next calendar day', () => {
    expect(isConsecutiveDay('2026-06-01', '2026-06-02')).toBe(true);
    expect(isConsecutiveDay('2026-06-01', '2026-06-03')).toBe(false);
    expect(isConsecutiveDay(null, '2026-06-02')).toBe(false);
  });
});

describe('recordDailyWin', () => {
  it('first win sets streak 1 and records best time', () => {
    const s = recordDailyWin(emptyStats(), '2026-06-01', 48000);
    expect(s.streak).toBe(1);
    expect(s.bestMs['2026-06-01']).toBe(48000);
    expect(hasPlayed(s, '2026-06-01')).toBe(true);
  });
  it('consecutive day increments streak', () => {
    let s = recordDailyWin(emptyStats(), '2026-06-01', 48000);
    s = recordDailyWin(s, '2026-06-02', 50000);
    expect(s.streak).toBe(2);
  });
  it('a gap resets streak to 1', () => {
    let s = recordDailyWin(emptyStats(), '2026-06-01', 48000);
    s = recordDailyWin(s, '2026-06-03', 50000);
    expect(s.streak).toBe(1);
  });
  it('replaying the same day keeps streak and keeps the best (min) time', () => {
    let s = recordDailyWin(emptyStats(), '2026-06-01', 48000);
    s = recordDailyWin(s, '2026-06-01', 40000);
    expect(s.streak).toBe(1);
    expect(s.bestMs['2026-06-01']).toBe(40000);
    const s2 = recordDailyWin(s, '2026-06-01', 99000);
    expect(s2.bestMs['2026-06-01']).toBe(40000);
  });
});

describe('loadStats/saveStats round-trip', () => {
  it('persists through an injectable storage', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const s = recordDailyWin(emptyStats(), '2026-06-01', 48000);
    saveStats(s, storage);
    expect(loadStats(storage)).toEqual(s);
  });
  it('loadStats returns empty stats when nothing stored', () => {
    const storage = { getItem: () => null, setItem: () => {} };
    expect(loadStats(storage)).toEqual(emptyStats());
  });
});
