import { describe, it, expect } from 'vitest';
import { bucketByDifficulty, buildDailySchedule } from './package';
import type { Puzzle } from '../../src/engine/types';

const mk = (id: string, difficulty: number): Puzzle => ({ id, size: [5, 5], difficulty, pairs: [] });

describe('bucketByDifficulty', () => {
  it('groups by difficulty value', () => {
    const out = bucketByDifficulty([mk('a', 2), mk('b', 2), mk('c', 5)]);
    expect(out[2].map((p) => p.id)).toEqual(['a', 'b']);
    expect(out[5].map((p) => p.id)).toEqual(['c']);
  });
});

describe('buildDailySchedule', () => {
  it('produces one entry per day with ISO dates and known ids', () => {
    const byBucket = { 2: [mk('mon', 2)], 3: [mk('tue', 3)] };
    // 2026-06-01 is a Monday
    const sched = buildDailySchedule(byBucket, '2026-06-01', 2);
    expect(sched).toHaveLength(2);
    expect(sched[0].date).toBe('2026-06-01');
    expect(sched[0].id).toBe('mon'); // Monday -> bucket 2
    expect(sched[1].date).toBe('2026-06-02');
    expect(sched[1].id).toBe('tue'); // Tuesday -> bucket 3
  });
});
