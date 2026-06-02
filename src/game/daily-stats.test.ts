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

describe('recordDailyWin — streak freeze & best streak', () => {
  // build a 7-day streak to earn a freeze
  const sevenDay = () => {
    let s = emptyStats();
    for (let d = 1; d <= 7; d++) s = recordDailyWin(s, `2026-06-0${d}`, 50000);
    return s;
  };
  it('earns a freeze at a 7-day streak', () => {
    const s = sevenDay();
    expect(s.streak).toBe(7);
    expect(s.bestStreak).toBe(7);
    expect(s.freezeAvailable).toBe(true);
  });
  it('a freeze saves the streak across a single missed day', () => {
    const s = sevenDay();                 // streak 7, freeze available, last 2026-06-07
    const after = recordDailyWin(s, '2026-06-09', 50000); // missed 06-08 (gap 2)
    expect(after.streak).toBe(8);         // saved, not reset
    expect(after.freezeAvailable).toBe(false); // consumed
  });
  it('without a freeze, a missed day resets the streak', () => {
    let s = recordDailyWin(emptyStats(), '2026-06-01', 50000); // streak 1, no freeze
    s = recordDailyWin(s, '2026-06-03', 50000);                // gap 2, no freeze -> reset
    expect(s.streak).toBe(1);
  });
  it('two missed days always reset, even with a freeze', () => {
    const s = sevenDay();
    const after = recordDailyWin(s, '2026-06-11', 50000); // gap 4 from 06-07
    expect(after.streak).toBe(1);
  });
  it('keeps bestStreak as the all-time max', () => {
    let s = sevenDay();                       // best 7
    s = recordDailyWin(s, '2026-06-20', 50000); // big gap -> streak 1, best stays 7
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(7);
  });
  it('records playedDates', () => {
    let s = recordDailyWin(emptyStats(), '2026-06-01', 50000);
    s = recordDailyWin(s, '2026-06-02', 50000);
    expect(s.playedDates).toEqual(['2026-06-01', '2026-06-02']);
  });
});

describe('normalizeStats migrates old data', () => {
  it('fills missing fields from legacy {lastDate,streak,bestMs}', () => {
    const storage = { getItem: () => JSON.stringify({ lastDate: '2026-06-01', streak: 3, bestMs: { '2026-06-01': 9000 } }), setItem: () => {} };
    const s = loadStats(storage);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(0);
    expect(s.freezeAvailable).toBe(false);
    expect(s.playedDates).toEqual([]);
  });
});
