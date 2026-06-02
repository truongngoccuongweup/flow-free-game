import { describe, it, expect } from 'vitest';
import { indexById, dailyDateISO, puzzleForDate, endlessOrder, type DailyEntry } from './level-repository';
import type { Puzzle } from '../engine/types';

const mk = (id: string, difficulty: number): Puzzle => ({ id, size: [5, 5], difficulty, pairs: [] });

describe('indexById', () => {
  it('maps id -> puzzle', () => {
    const map = indexById([mk('a', 1), mk('b', 2)]);
    expect(map.get('b')?.difficulty).toBe(2);
    expect(map.get('missing')).toBeUndefined();
  });
});

describe('dailyDateISO', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dailyDateISO(new Date(2026, 5, 2))).toBe('2026-06-02'); // month is 0-indexed
    expect(dailyDateISO(new Date(2026, 11, 9))).toBe('2026-12-09');
  });
});

describe('puzzleForDate', () => {
  const byId = indexById([mk('mon', 2), mk('tue', 3)]);
  const schedule: DailyEntry[] = [
    { date: '2026-06-01', id: 'mon' },
    { date: '2026-06-02', id: 'tue' },
  ];
  it('returns the puzzle scheduled for the date', () => {
    expect(puzzleForDate(schedule, byId, '2026-06-02')?.id).toBe('tue');
  });
  it('returns null when no entry or puzzle missing', () => {
    expect(puzzleForDate(schedule, byId, '2099-01-01')).toBeNull();
  });
});

describe('endlessOrder', () => {
  it('sorts ascending by difficulty then id', () => {
    const out = endlessOrder([mk('b', 5), mk('a', 5), mk('c', 2)]);
    expect(out.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });
});
