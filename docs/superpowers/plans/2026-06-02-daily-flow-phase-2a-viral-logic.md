# Daily Flow — Phase 2a: Viral Logic — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the pure, framework-free logic behind the viral loop — solve-time formatting, Daily puzzle numbering, relative-rank ("faster than X%") estimation, the spoiler-free share-text builder, and localStorage-backed streak/daily stats. Fully unit-tested, no browser.

**Architecture:** Pure TypeScript in `src/game/`, building on Phase 1a (`level-repository` `DailyEntry`). Phase 2b (UI) will consume these in the Daily screen, win/result screen, and share button.

**Tech Stack:** TypeScript, Vitest, pnpm. No new deps.

**Reference spec:** `docs/superpowers/specs/2026-06-02-daily-flow-design.md` (§3.1 Daily, §5 Viral).

**Builds on:** `src/game/level-repository.ts` (`DailyEntry`, `dailyDateISO`).

**Note on the rank stub:** Without a backend collecting real solve times, `fasterThanPercent` uses a logistic curve around a per-difficulty reference median. This is an intentional placeholder (spec §9) — when a backend exists, swap the median/curve for the real distribution. The function signature stays the same.

## Branching
```bash
git checkout main && git pull
git checkout -b feat/phase-2a-viral-logic
```

## File structure
```
src/game/format.ts        # formatTime(ms) -> "M:SS"
src/game/daily.ts         # dailyNumber(schedule, dateISO)
src/game/rank.ts          # referenceMedianMs, fasterThanPercent
src/game/share.ts         # buildShareText (spoiler-free)
src/game/daily-stats.ts   # streak/best-time store (+ localStorage adapter)
(+ matching .test.ts files)
```

---

### Task 1: formatTime

**Files:** Create `src/game/format.ts`, `src/game/format.test.ts`

- [ ] **Step 1: Failing test** — `src/game/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it('formats milliseconds as M:SS', () => {
    expect(formatTime(48000)).toBe('0:48');
    expect(formatTime(754000)).toBe('12:34');
    expect(formatTime(0)).toBe('0:00');
  });
  it('floors sub-second remainder and clamps negatives', () => {
    expect(formatTime(48999)).toBe('0:48');
    expect(formatTime(-5)).toBe('0:00');
  });
});
```

- [ ] **Step 2: Run** — `pnpm vitest run src/game/format.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implementation** — `src/game/format.ts`:
```ts
export function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run** — `pnpm vitest run src/game/format.test.ts` — Expected: PASS (2 tests).

- [ ] **Step 5: Commit** — `git add src/game/format.ts src/game/format.test.ts && git commit -m "feat(game): formatTime helper"`

---

### Task 2: dailyNumber

**Files:** Create `src/game/daily.ts`, `src/game/daily.test.ts`

- [ ] **Step 1: Failing test** — `src/game/daily.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { dailyNumber } from './daily';
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
```

- [ ] **Step 2: Run** — `pnpm vitest run src/game/daily.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/game/daily.ts`:
```ts
import type { DailyEntry } from './level-repository';

export function dailyNumber(schedule: DailyEntry[], dateISO: string): number | null {
  const i = schedule.findIndex((e) => e.date === dateISO);
  return i === -1 ? null : i + 1;
}
```

- [ ] **Step 4: Run** — Expected: PASS (2 tests).

- [ ] **Step 5: Commit** — `git add src/game/daily.ts src/game/daily.test.ts && git commit -m "feat(game): dailyNumber from schedule"`

---

### Task 3: Relative rank (stub)

**Files:** Create `src/game/rank.ts`, `src/game/rank.test.ts`

- [ ] **Step 1: Failing test** — `src/game/rank.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { fasterThanPercent, referenceMedianMs } from './rank';

describe('fasterThanPercent', () => {
  it('is 50 at the median', () => {
    expect(fasterThanPercent(50000, 50000)).toBe(50);
  });
  it('is higher when faster than the median, lower when slower', () => {
    expect(fasterThanPercent(20000, 50000)).toBeGreaterThan(50);
    expect(fasterThanPercent(90000, 50000)).toBeLessThan(50);
  });
  it('clamps to 1..99', () => {
    expect(fasterThanPercent(1, 50000)).toBeLessThanOrEqual(99);
    expect(fasterThanPercent(1, 50000)).toBeGreaterThanOrEqual(1);
    expect(fasterThanPercent(10_000_000, 50000)).toBeGreaterThanOrEqual(1);
  });
});

describe('referenceMedianMs', () => {
  it('grows with difficulty', () => {
    expect(referenceMedianMs(7)).toBeGreaterThan(referenceMedianMs(3));
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/game/rank.ts`:
```ts
// Stub model until a backend collects real solve-time distributions (see spec §9).
export function referenceMedianMs(difficulty: number): number {
  return 20000 + difficulty * 8000;
}

export function fasterThanPercent(timeMs: number, medianMs: number): number {
  const k = 0.0012; // logistic steepness per ms
  const p = 1 / (1 + Math.exp(k * (timeMs - medianMs)));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}
```

- [ ] **Step 4: Run** — Expected: PASS (4 tests).

- [ ] **Step 5: Commit** — `git add src/game/rank.ts src/game/rank.test.ts && git commit -m "feat(game): relative-rank stub (faster-than percent)"`

---

### Task 4: Spoiler-free share text

**Files:** Create `src/game/share.ts`, `src/game/share.test.ts`

The share text shows the day number, time, relative rank, streak, and a row of colored squares (which COLORS were in the puzzle — never the solution path). Wordle-style, spoiler-free.

- [ ] **Step 1: Failing test** — `src/game/share.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildShareText } from './share';

describe('buildShareText', () => {
  const r = { dayNumber: 142, timeText: '0:48', fasterThan: 73, streak: 8, colorCount: 5 };
  it('includes day number, time, rank, streak and url', () => {
    const out = buildShareText(r);
    expect(out).toContain('Daily Flow #142');
    expect(out).toContain('0:48');
    expect(out).toContain('73%');
    expect(out).toContain('🔥8');
    expect(out).toContain('dailyflow.app');
  });
  it('renders one square per color (spoiler-free)', () => {
    const out = buildShareText(r);
    const squareLine = out.split('\n').find((l) => /\p{Extended_Pictographic}/u.test(l) && !l.includes('Daily'))!;
    expect([...squareLine].length).toBe(5);
  });
  it('accepts a custom url', () => {
    expect(buildShareText(r, 'example.com')).toContain('example.com');
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/game/share.ts`:
```ts
export interface ShareResult {
  dayNumber: number;
  timeText: string;
  fasterThan: number;
  streak: number;
  colorCount: number;
}

const SQUARES = ['🟥', '🟦', '🟩', '🟨', '🟧', '🟫', '🟪', '⬛'] as const;

export function buildShareText(r: ShareResult, url = 'dailyflow.app'): string {
  const squares = Array.from({ length: r.colorCount }, (_, i) => SQUARES[i % SQUARES.length]).join('');
  return `Daily Flow #${r.dayNumber} ⚡ ${r.timeText}\nNhanh hơn ${r.fasterThan}% · 🔥${r.streak}\n${squares}\n${url}`;
}
```

- [ ] **Step 4: Run** — Expected: PASS (3 tests).

- [ ] **Step 5: Commit** — `git add src/game/share.ts src/game/share.test.ts && git commit -m "feat(game): spoiler-free share-text builder"`

---

### Task 5: Daily stats (streak + best times + storage)

**Files:** Create `src/game/daily-stats.ts`, `src/game/daily-stats.test.ts`

`recordDailyWin` advances the streak (consecutive calendar days), resets it on a gap, and keeps the best time per date; replaying the same day keeps the streak and the best (min) time. A thin localStorage adapter persists it (injectable storage for tests).

- [ ] **Step 1: Failing test** — `src/game/daily-stats.test.ts`:
```ts
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
    expect(s2.bestMs['2026-06-01']).toBe(40000); // not worsened
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
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/game/daily-stats.ts`:
```ts
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
```
(Storage is injected explicitly — callers in Phase 2b pass `window.localStorage` from a client component, keeping this module SSR-safe and testable.)

- [ ] **Step 4: Run** — `pnpm vitest run src/game/daily-stats.test.ts` — Expected: PASS (7 tests). Then `pnpm test` — Expected: ALL pass; report total.

- [ ] **Step 5: Commit** — `git add src/game/daily-stats.ts src/game/daily-stats.test.ts && git commit -m "feat(game): daily streak + best-time stats with storage adapter"`

---

## Self-review (against spec §3.1, §5)
- **Solve-time formatting (hero metric):** `formatTime`. ✓
- **"Daily Flow #N":** `dailyNumber`. ✓
- **"Faster than X%" relative rank (spoiler-free, motivating):** `fasterThanPercent` (+ stub median, flagged). ✓
- **Shareable artifact (speed + rank + streak + color squares, no solution):** `buildShareText`. ✓
- **Streak (consecutive days, reset on gap), once-per-day best time:** `recordDailyWin`/`isConsecutiveDay`/`hasPlayed`. ✓
- **Local-midnight daily reset:** reuses `dailyDateISO` (Phase 1a) in 2b. ✓
- **SSR-safe storage:** injected, no bare `localStorage` at module scope. ✓
- **Deferred to 2b:** Daily screen + timer hook, win/result screen, Share button (clipboard), countdown-to-next, OG image route, mode toggle/routing.
