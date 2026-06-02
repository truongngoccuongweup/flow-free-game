export interface DailyStats {
  lastDate: string | null;
  streak: number;
  bestMs: Record<string, number>;
  bestStreak: number;
  freezeAvailable: boolean;   // one free "miss" that keeps the streak alive
  playedDates: string[];      // for the streak calendar
}

export const emptyStats = (): DailyStats => ({
  lastDate: null, streak: 0, bestMs: {}, bestStreak: 0, freezeAvailable: false, playedDates: [],
});

/** Fill in any fields missing from older saved data. */
export function normalizeStats(partial: Partial<DailyStats> | null | undefined): DailyStats {
  return { ...emptyStats(), ...(partial ?? {}) };
}

export function gapDays(prevISO: string | null, dateISO: string): number {
  if (!prevISO) return Infinity;
  const prev = Date.parse(`${prevISO}T00:00:00Z`);
  const cur = Date.parse(`${dateISO}T00:00:00Z`);
  return Math.round((cur - prev) / 86_400_000);
}

export function isConsecutiveDay(prevISO: string | null, dateISO: string): boolean {
  return gapDays(prevISO, dateISO) === 1;
}

export function hasPlayed(stats: DailyStats, dateISO: string): boolean {
  return stats.bestMs[dateISO] != null;
}

export function recordDailyWin(stats: DailyStats, dateISO: string, timeMs: number): DailyStats {
  // Replaying the same day: keep best time + streak/freeze unchanged.
  if (hasPlayed(stats, dateISO)) {
    return { ...stats, bestMs: { ...stats.bestMs, [dateISO]: Math.min(stats.bestMs[dateISO], timeMs) } };
  }
  const gap = gapDays(stats.lastDate, dateISO);
  let streak: number;
  let freezeAvailable = stats.freezeAvailable;
  if (gap === 1) {
    streak = stats.streak + 1;                       // consecutive day
  } else if (gap === 2 && stats.freezeAvailable) {
    streak = stats.streak + 1;                       // freeze saves a single missed day
    freezeAvailable = false;
  } else {
    streak = 1;                                      // streak broken
  }
  if (streak % 7 === 0) freezeAvailable = true;      // earn a freeze every 7-day streak
  const playedDates = stats.playedDates.includes(dateISO) ? stats.playedDates : [...stats.playedDates, dateISO];
  return {
    lastDate: dateISO,
    streak,
    bestMs: { ...stats.bestMs, [dateISO]: timeMs },
    bestStreak: Math.max(stats.bestStreak, streak),
    freezeAvailable,
    playedDates,
  };
}

const KEY = 'daily-flow-stats';
type Getter = { getItem: (k: string) => string | null };
type Setter = { setItem: (k: string, v: string) => void };

export function loadStats(storage: Getter): DailyStats {
  try {
    const raw = storage.getItem(KEY);
    return raw ? normalizeStats(JSON.parse(raw) as Partial<DailyStats>) : emptyStats();
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
