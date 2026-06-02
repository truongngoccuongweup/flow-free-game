# Daily Flow — Phase 2b: Viral UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Complete the viral loop in the UI: a Daily mode with a live solve-timer, streak, and "Daily Flow #N"; a win/result screen showing time + "faster than X%" + a Share button that copies a spoiler-free result to the clipboard + a countdown to the next puzzle; a Daily/Endless toggle; and an OG image route so shared links show an attractive preview. Runnable via `pnpm dev`.

**Architecture:** Next.js client components on top of Phase 1b (`Board`, `useFlowBoard`, `EndlessGame`) and Phase 2a pure logic (`format`, `daily`, `rank`, `share`, `daily-stats`). New pure helper `countdown`. Presentational `DailyResult` (testable, clipboard mocked). `DailyGame` wires board + stopwatch + stats + result. Home page adds a mode toggle and resolves today's Daily puzzle. OG route uses `next/og`.

**Tech Stack:** Next.js + React + TS, Vitest + @testing-library/react + jsdom, `next/og`, pnpm.

**Reference:** spec §3.1, §5; mockup `mockups/daily-flow-mockup.html` (screens 2–3).

**Builds on:** `src/ui/{Board,useFlowBoard,EndlessGame}`, `src/game/{format,daily,rank,share,daily-stats,level-repository,level-loader}`.

**jsdom note (same as Phase 1b):** no layout; timer/stopwatch wall-clock behavior and OG rendering are verified by the dev run (Task 6), not jsdom. Pure helpers and presentational components are unit-tested.

## Branching
```bash
git checkout main && git pull
git checkout -b feat/phase-2b-viral-ui
```

## File structure
```
src/game/countdown.ts          # secondsToNextMidnight, formatCountdown (pure)
src/ui/useStopwatch.ts         # elapsed-time hook
src/ui/DailyResult.tsx         # result/share overlay (presentational)
src/ui/DailyGame.tsx           # board + timer + stats + result
src/app/og/route.tsx           # OG share image
src/app/page.tsx               # add Daily/Endless toggle (modify)
src/app/globals.css            # add .df-seg styles (modify)
(+ matching .test.ts(x) files)
```

---

### Task 1: countdown helpers (pure)

**Files:** Create `src/game/countdown.ts`, `src/game/countdown.test.ts`

- [ ] **Step 1: Failing test** — `src/game/countdown.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { secondsToNextMidnight, formatCountdown } from './countdown';

describe('secondsToNextMidnight', () => {
  it('counts seconds to the next local midnight', () => {
    expect(secondsToNextMidnight(new Date(2026, 5, 2, 23, 0, 0))).toBe(3600);
    expect(secondsToNextMidnight(new Date(2026, 5, 2, 0, 0, 0))).toBe(86400);
  });
});

describe('formatCountdown', () => {
  it('formats seconds as HH:MM:SS', () => {
    expect(formatCountdown(3661)).toBe('01:01:01');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});
```

- [ ] **Step 2: Run** — `pnpm vitest run src/game/countdown.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/game/countdown.ts`:
```ts
export function secondsToNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.floor((next.getTime() - now.getTime()) / 1000);
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}
```

- [ ] **Step 4: Run** — Expected: PASS (2 tests).

- [ ] **Step 5: Commit** — `git add src/game/countdown.ts src/game/countdown.test.ts && git commit -m "feat(game): countdown to next daily reset"`

---

### Task 2: useStopwatch hook

**Files:** Create `src/ui/useStopwatch.ts`, `src/ui/useStopwatch.test.tsx`

Tracks elapsed ms while `running`; `elapsed()` returns the exact current elapsed for capturing the final solve time. Only the initial value is unit-tested (timer ticking verified at dev run).

- [ ] **Step 1: Failing test** — `src/ui/useStopwatch.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStopwatch } from './useStopwatch';

describe('useStopwatch', () => {
  it('starts at 0 ms and exposes an elapsed() function', () => {
    const { result } = renderHook(() => useStopwatch(false));
    expect(result.current.ms).toBe(0);
    expect(typeof result.current.elapsed).toBe('function');
    expect(result.current.elapsed()).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/ui/useStopwatch.ts`:
```ts
'use client';
import { useEffect, useRef, useState } from 'react';

export function useStopwatch(running: boolean) {
  const startRef = useRef<number>(Date.now());
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setMs(Date.now() - startRef.current), 250);
    return () => clearInterval(id);
  }, [running]);
  const elapsed = (): number => Date.now() - startRef.current;
  return { ms, elapsed };
}
```

- [ ] **Step 4: Run** — Expected: PASS (1 test).

- [ ] **Step 5: Commit** — `git add src/ui/useStopwatch.ts src/ui/useStopwatch.test.tsx && git commit -m "feat(ui): useStopwatch elapsed-time hook"`

---

### Task 3: DailyResult overlay

**Files:** Create `src/ui/DailyResult.tsx`, `src/ui/DailyResult.test.tsx`

Presentational result/share dialog. Builds the spoiler-free text via `buildShareText` and copies it to the clipboard on "Khoe kết quả".

- [ ] **Step 1: Failing test** — `src/ui/DailyResult.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { DailyResult } from './DailyResult';

afterEach(cleanup);

const props = {
  dayNumber: 142, timeText: '0:48', fasterThan: 73, streak: 8, colorCount: 5,
  countdownText: '14:32:06', onPlayEndless: () => {},
};

describe('DailyResult', () => {
  it('shows time, rank, streak and countdown', () => {
    const { getByText } = render(<DailyResult {...props} />);
    expect(getByText('0:48')).toBeTruthy();
    expect(getByText(/Nhanh hơn 73%/)).toBeTruthy();
    expect(getByText(/14:32:06/)).toBeTruthy();
  });
  it('copies spoiler-free share text to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByText } = render(<DailyResult {...props} />);
    fireEvent.click(getByText('Khoe kết quả'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('Daily Flow #142');
    await waitFor(() => expect(getByText(/Đã copy/)).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementation** — `src/ui/DailyResult.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { buildShareText } from '../game/share';

interface DailyResultProps {
  dayNumber: number;
  timeText: string;
  fasterThan: number;
  streak: number;
  colorCount: number;
  countdownText: string;
  onPlayEndless: () => void;
}

export function DailyResult({ dayNumber, timeText, fasterThan, streak, colorCount, countdownText, onPlayEndless }: DailyResultProps) {
  const [copied, setCopied] = useState(false);
  const share = async (): Promise<void> => {
    const text = buildShareText({ dayNumber, timeText, fasterThan, streak, colorCount });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="df-win" role="dialog" aria-label="Kết quả">
      <div className="df-win-card">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>Daily Flow #{dayNumber}</p>
        <p className="df-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 46, margin: '4px 0' }}>{timeText}</p>
        <p style={{ margin: '0 0 18px' }}>Nhanh hơn {fasterThan}% · 🔥{streak}</p>
        <button className="df-btn df-cta" style={{ width: '100%' }} onClick={share}>
          {copied ? 'Đã copy! 📋' : 'Khoe kết quả'}
        </button>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '14px 0 8px' }}>Màn mới sau {countdownText}</p>
        <button className="df-btn" style={{ width: '100%' }} onClick={onPlayEndless}>Chơi Endless</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run** — Expected: PASS (2 tests).

- [ ] **Step 5: Commit** — `git add src/ui/DailyResult.tsx src/ui/DailyResult.test.tsx && git commit -m "feat(ui): DailyResult share overlay"`

---

### Task 4: DailyGame + mode toggle on the home page

**Files:** Create `src/ui/DailyGame.tsx`; modify `src/app/page.tsx`, `src/app/globals.css`

`DailyGame` shows a live timer, the board, Undo/Reset, and on win records daily stats (streak + best time in localStorage) and shows `DailyResult` with a live countdown. The home page resolves today's Daily puzzle from the schedule and offers a Daily/Endless toggle.

- [ ] **Step 1: Append toggle styles to `src/app/globals.css`:**
```css
.df-seg { display: flex; background: #EEF0F5; border-radius: 14px; padding: 4px; margin: 4px 0 8px; }
.df-seg button { flex: 1; border: none; background: transparent; font-family: var(--font-heading), sans-serif; font-weight: 600; font-size: 14px; padding: 9px 0; border-radius: 10px; color: var(--muted); cursor: pointer; }
.df-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.df-timer { text-align: center; font-family: var(--font-mono), monospace; font-variant-numeric: tabular-nums; font-size: 28px; font-weight: 700; padding: 4px 0 0; }
```

- [ ] **Step 2: Create `src/ui/DailyGame.tsx`:**
```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';
import { useStopwatch } from './useStopwatch';
import { DailyResult } from './DailyResult';
import { formatTime } from '../game/format';
import { fasterThanPercent, referenceMedianMs } from '../game/rank';
import { loadStats, saveStats, recordDailyWin } from '../game/daily-stats';
import { dailyDateISO } from '../game/level-repository';
import { secondsToNextMidnight, formatCountdown } from '../game/countdown';

export function DailyGame({ puzzle, dayNumber, onPlayEndless }: { puzzle: Puzzle; dayNumber: number; onPlayEndless: () => void }) {
  const b = useFlowBoard(puzzle);
  const sw = useStopwatch(!b.won);
  const [result, setResult] = useState<{ timeText: string; fasterThan: number; streak: number } | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!b.won || result) return;
    const ms = sw.elapsed();
    const date = dailyDateISO(new Date());
    const stats = recordDailyWin(loadStats(window.localStorage), date, ms);
    saveStats(stats, window.localStorage);
    setResult({
      timeText: formatTime(ms),
      fasterThan: fasterThanPercent(ms, referenceMedianMs(puzzle.difficulty)),
      streak: stats.streak,
    });
  }, [b.won, result, sw, puzzle]);

  useEffect(() => {
    if (!result) return;
    const tick = (): void => setCountdown(formatCountdown(secondsToNextMidnight(new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result]);

  return (
    <>
      <div className="df-timer">{formatTime(sw.ms)}</div>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board puzzle={puzzle} state={b.state} svgRef={b.svgRef} onPointerDown={b.onPointerDown} onPointerMove={b.onPointerMove} onPointerUp={b.onPointerUp} />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Undo</button>
        <button className="df-btn" onClick={b.reset}>Reset</button>
      </div>
      {result && (
        <DailyResult
          dayNumber={dayNumber}
          timeText={result.timeText}
          fasterThan={result.fasterThan}
          streak={result.streak}
          colorCount={puzzle.pairs.length}
          countdownText={countdown}
          onPlayEndless={onPlayEndless}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Replace `src/app/page.tsx` with:**
```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { indexById, puzzleForDate, dailyDateISO, type DailyEntry } from '../game/level-repository';
import { dailyNumber } from '../game/daily';
import { EndlessGame } from '../ui/EndlessGame';
import { DailyGame } from '../ui/DailyGame';

export default function Home() {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [schedule, setSchedule] = useState<DailyEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'daily' | 'endless'>('daily');

  useEffect(() => {
    Promise.all([
      loadEndlessPuzzles(),
      fetch('/levels/daily-schedule.json').then((r) => r.json() as Promise<DailyEntry[]>),
    ])
      .then(([p, s]) => { setPuzzles(p); setSchedule(s); })
      .catch(() => setFailed(true));
  }, []);

  const today = dailyDateISO(new Date());
  const daily = puzzles && schedule ? puzzleForDate(schedule, indexById(puzzles), today) : null;
  const dayNo = schedule ? dailyNumber(schedule, today) : null;

  return (
    <main className="df-shell">
      <header style={{ padding: '20px 0 4px' }}>
        <span className="df-title" style={{ fontSize: 22 }}>Daily Flow</span>
        <p style={{ color: 'var(--muted)', margin: '2px 0 0', fontSize: 13 }}>Nối hai chấm cùng màu · lấp đầy bảng</p>
      </header>
      <div className="df-seg" role="tablist">
        <button className={mode === 'daily' ? 'on' : ''} onClick={() => setMode('daily')}>Daily</button>
        <button className={mode === 'endless' ? 'on' : ''} onClick={() => setMode('endless')}>Endless</button>
      </div>
      {failed && <p style={{ color: 'var(--muted)' }}>Không tải được màn chơi.</p>}
      {!failed && !puzzles && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}
      {puzzles && mode === 'endless' && <EndlessGame puzzles={puzzles} />}
      {puzzles && mode === 'daily' &&
        (daily && dayNo
          ? <DailyGame key={daily.id} puzzle={daily} dayNumber={dayNo} onPlayEndless={() => setMode('endless')} />
          : <p style={{ color: 'var(--muted)' }}>Hôm nay chưa có màn Daily.</p>)}
    </main>
  );
}
```

- [ ] **Step 4: Run** — `pnpm test` — Expected: ALL pass (no new test file here; existing suite must stay green). Report total. Then `pnpm build` — Expected: succeeds.

- [ ] **Step 5: Commit** — `git add src/ui/DailyGame.tsx src/app/page.tsx src/app/globals.css && git commit -m "feat(ui): Daily mode with timer, streak, result, and mode toggle"`

---

### Task 5: OG share image route

**Files:** Create `src/app/og/route.tsx`

Renders a 1200×630 share card from query params (`n`=day number, `t`=time, `r`=rank). Shared links use `/og?n=142&t=0:48&r=73` as their preview image.

- [ ] **Step 1: Create `src/app/og/route.tsx`:**
```tsx
import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

export function GET(req: Request): ImageResponse {
  const { searchParams } = new URL(req.url);
  const n = searchParams.get('n') ?? '?';
  const t = searchParams.get('t') ?? '--:--';
  const r = searchParams.get('r') ?? '0';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0E0F13', color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, color: '#8893AB' }}>Daily Flow #{n}</div>
        <div style={{ fontSize: 160, fontWeight: 800, color: '#4C6EF5' }}>{t}</div>
        <div style={{ fontSize: 44 }}>Nhanh hơn {r}% người chơi</div>
        <div style={{ fontSize: 28, color: '#8893AB', marginTop: 24 }}>dailyflow · nối đường, lấp đầy bảng</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```
(If `next/og` is unavailable in this Next version, report it — do not fake an image; we can fall back to a static asset.)

- [ ] **Step 2: Verify it builds** — Run: `pnpm build` — Expected: succeeds and lists the `/og` route.

- [ ] **Step 3: Commit** — `git add src/app/og/route.tsx && git commit -m "feat(ui): OG share-image route"`

---

### Task 6: Build + dev-run verification

**Files:** none

- [ ] **Step 1: Build** — `pnpm build` — Expected: success, routes include `/` and `/og`.
- [ ] **Step 2: Start dev server (background) and verify:**
```bash
pnpm dev > /tmp/df-2b.log 2>&1 &
sleep 7
curl -sS -o /dev/null -w "home %{http_code}\n" http://localhost:3000
curl -sS -o /dev/null -w "og %{http_code} %{content_type}\n" "http://localhost:3000/og?n=142&t=0:48&r=73"
curl -sS -o /dev/null -w "schedule %{http_code}\n" http://localhost:3000/levels/daily-schedule.json
```
Expected: home `200`; og `200` with `image/png`; schedule `200`.
- [ ] **Step 3: Report** the three results and whether to leave the dev server running. Do not commit.

---

## Self-review (against spec §3.1, §5)
- **Daily mode, today's puzzle by local date, "Daily Flow #N":** page resolves via `puzzleForDate` + `dailyNumber`. ✓
- **Live solve timer (hero metric, tabular):** `useStopwatch` + `.df-timer` mono/tabular. ✓
- **Streak + once-per-day best time persisted:** `recordDailyWin`/`loadStats`/`saveStats` on win. ✓
- **Win/result: time + faster-than% + streak + Share (spoiler-free, clipboard) + countdown:** `DailyResult` + `buildShareText` + `countdown`. ✓
- **Daily/Endless toggle:** `.df-seg` segmented control. ✓
- **Link preview for virality:** `/og` ImageResponse. ✓
- **Deferred:** real backend rank distribution, friend leaderboard, push/notifications, onboarding, ads — later phases.
