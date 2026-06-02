import type { Puzzle } from '../../src/engine/types';

export function bucketByDifficulty(puzzles: Puzzle[]): Record<number, Puzzle[]> {
  const out: Record<number, Puzzle[]> = {};
  for (const p of puzzles) (out[p.difficulty] ??= []).push(p);
  return out;
}

// Mon..Sun -> target difficulty bucket (NYT-style weekly ramp).
const WEEKDAY_BUCKET: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 0: 7 };

const nearestBucket = (byBucket: Record<number, Puzzle[]>, target: number): number => {
  const keys = Object.keys(byBucket).map(Number).filter((k) => byBucket[k].length > 0);
  if (keys.length === 0) return target;
  return keys.reduce((best, k) => (Math.abs(k - target) < Math.abs(best - target) ? k : best), keys[0]);
};

export function buildDailySchedule(
  byBucket: Record<number, Puzzle[]>,
  startISO: string,
  days: number,
): { date: string; id: string }[] {
  const out: { date: string; id: string }[] = [];
  const cursor: Record<number, number> = {};
  const start = new Date(`${startISO}T00:00:00Z`);
  for (let d = 0; d < days; d++) {
    const day = new Date(start.getTime() + d * 86400000);
    const iso = day.toISOString().slice(0, 10);
    const bucket = nearestBucket(byBucket, WEEKDAY_BUCKET[day.getUTCDay()]);
    const pool = byBucket[bucket] ?? [];
    if (pool.length === 0) continue;
    const idx = (cursor[bucket] ?? 0) % pool.length;
    cursor[bucket] = idx + 1;
    out.push({ date: iso, id: pool[idx].id });
  }
  return out;
}
