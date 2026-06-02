import { describe, it, expect } from 'vitest';
import { dailyNumber, dailyNumberById } from './daily';
import type { DailyEntry } from './level-repository';

const schedule: DailyEntry[] = [
  { date: '2026-06-01', id: 'a' },
  { date: '2026-06-02', id: 'b' },
  { date: '2026-06-03', id: 'c' },
];

describe('dailyNumber', () => {
  it('returns the 1-based position of the date', () => {
    expect(dailyNumber(schedule, '2026-06-01')).toBe(1);
    expect(dailyNumber(schedule, '2026-06-03')).toBe(3);
  });
  it('returns null for an unscheduled date', () => {
    expect(dailyNumber(schedule, '2099-01-01')).toBeNull();
  });
});

describe('dailyNumberById', () => {
  it('returns the 1-based position of the puzzle id', () => {
    expect(dailyNumberById(schedule, 'a')).toBe(1);
    expect(dailyNumberById(schedule, 'c')).toBe(3);
  });
  it('returns null when the id is not scheduled', () => {
    expect(dailyNumberById(schedule, 'zzz')).toBeNull();
  });
});
