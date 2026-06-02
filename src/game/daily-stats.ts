export interface DailyStats {
  lastDate: string | null;
  streak: number;
  bestMs: Record<string, number>;
}

export const emptyStats = (): DailyStats => ({ lastDate: null, streak: 0, bestMs: {} });

export function isConsecutiveDay(prevISO: string | null, dateISO: string): boolean {
  if (!prevISO) return false;
  const prev = Date.parse(`${prevISO}T00:00:00Z`);
  const cur = Date.parse(`${dateISO}T00:00:00Z`);
  return cur - prev === 86_400_000;
}

export function hasPlayed(stats: DailyStats, dateISO: string): boolean {
  return stats.bestMs[dateISO] != null;
}

export function recordDailyWin(stats: DailyStats, dateISO: string, timeMs: number): DailyStats {
  if (stats.bestMs[dateISO] != null) {
    return { ...stats, bestMs: { ...stats.bestMs, [dateISO]: Math.min(stats.bestMs[dateISO], timeMs) } };
  }
  const streak = isConsecutiveDay(stats.lastDate, dateISO) ? stats.streak + 1 : 1;
  return { lastDate: dateISO, streak, bestMs: { ...stats.bestMs, [dateISO]: timeMs } };
}

const KEY = 'daily-flow-stats';
type Getter = { getItem: (k: string) => string | null };
type Setter = { setItem: (k: string, v: string) => void };

export function loadStats(storage: Getter): DailyStats {
  try {
    const raw = storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DailyStats) : emptyStats();
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: DailyStats, storage: Setter): void {
  try {
    storage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable — ignore */
  }
}
