# Daily Flow — Phase 1b: Playable Web UI (Endless) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the tested play-logic core into a real, playable web app: an SVG board you solve by dragging with finger/mouse, an Endless mode that loads generated puzzles and advances by difficulty, with Undo/Reset and a win overlay, in the "calm canvas / vibrant ink" style — runnable via `pnpm dev`.

**Architecture:** Next.js App Router (client components). Pure, DOM-free helpers (`palette`, `geometry`) are unit-tested. A presentational `Board` SVG renders puzzle + play state. A `useFlowBoard` hook wires pointer events to the Phase-1a reducer (`beginAt`/`extendTo`/`endDrag`) using `pointToCell` + `stepsToward` (fast-drag interpolation). `EndlessGame` composes board + controls + win overlay; the home page loads puzzle packs from `public/levels/` and renders it. Logic is injected via props so components are testable without browser layout.

**Tech Stack:** Next.js + React + TypeScript, Vitest + @testing-library/react + jsdom (component tests), pnpm. Builds on Phase 0 (`src/engine/`) and Phase 1a (`src/game/`: `play-state`, `level-repository`).

**Reference:** spec `docs/superpowers/specs/2026-06-02-daily-flow-design.md` (§6 UI/UX, §7 Tech); mockup `mockups/daily-flow-mockup.html`.

**Known jsdom constraint:** jsdom does not compute layout — `getBoundingClientRect()` returns zeros and SVG geometry is not laid out. Therefore: pointer→cell math lives in pure functions tested with explicit numbers; the hook's event→coordinate mapping is verified by the dev-server run (Task 8), NOT by jsdom tests. Do not write jsdom tests that depend on element geometry.

**Deferred (not this plan):** Daily mode + streak + countdown, share artifact, Hint (needs the solution shipped in level JSON — a later Phase-0 tweak), onboarding flow, difficulty auto-ramp tuning, dark-mode toggle UI. Phase 1b ships a playable Endless loop only.

---

## Branching
```bash
git checkout main && git pull
git checkout -b feat/phase-1b-ui
```
(If `git pull` reports nothing to pull, continue.)

## File structure
```
src/ui/palette.ts          # flow color + colorblind glyph by color index
src/ui/palette.test.ts
src/ui/geometry.ts         # pointToCell, stepsToward (pure, DOM-free)
src/ui/geometry.test.ts
src/ui/Board.tsx           # presentational SVG board
src/ui/Board.test.tsx
src/ui/useFlowBoard.ts     # pointer<->reducer hook (+ undo/reset)
src/ui/useFlowBoard.test.tsx
src/ui/EndlessGame.tsx     # board + controls + win overlay + next
src/ui/EndlessGame.test.tsx
src/game/level-loader.ts   # fetch manifest + buckets -> ordered puzzles
src/game/level-loader.test.ts
src/app/page.tsx           # home: load packs, render EndlessGame (modify)
src/app/globals.css        # theme tokens + layout (modify)
src/app/layout.tsx         # fonts (modify)
```
Internal SVG unit: **U = 100** units per cell (constant shared by Board and the hook).

---

### Task 1: UI dependencies + theme tokens + fonts

**Files:** Modify `package.json` (deps), `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Install test + (no new runtime) deps**
```bash
pnpm add -D @testing-library/react @testing-library/dom jsdom
```

- [ ] **Step 2: Theme tokens** — replace the contents of `src/app/globals.css` with:
```css
:root {
  --canvas: #FAFAF8;
  --ink: #0F172A;
  --muted: #64748B;
  --line: #EBEDF2;
  --brand: #4C6EF5;
  --brand-press: #2F49C9;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-body), system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.df-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: env(safe-area-inset-top) 16px env(safe-area-inset-bottom);
}
.df-title { font-family: var(--font-heading), sans-serif; font-weight: 800; letter-spacing: -0.02em; }
.df-board-wrap { flex: 1; display: flex; align-items: center; justify-content: center; }
.df-board {
  background: #fff; border: 1px solid var(--line); border-radius: 24px; padding: 14px;
  width: 100%; box-shadow: 0 18px 30px -22px rgba(30,40,80,.35);
}
.df-controls { display: flex; gap: 12px; padding: 16px 0 24px; }
.df-btn {
  flex: 1; height: 56px; border: 1px solid var(--line); border-radius: 18px; background: #fff;
  font-family: var(--font-heading), sans-serif; font-weight: 600; font-size: 15px; color: var(--ink);
  cursor: pointer;
}
.df-btn:active { transform: scale(0.97); }
.df-win {
  position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; background: rgba(250,250,248,.86); backdrop-filter: blur(4px); z-index: 50;
}
.df-win-card { background: #fff; border: 1px solid var(--line); border-radius: 24px; padding: 28px 32px; text-align: center; box-shadow: 0 24px 48px -20px rgba(30,40,80,.4); }
.df-cta { background: var(--brand); color: #fff; border: none; box-shadow: 0 6px 0 var(--brand-press); }
```

- [ ] **Step 3: Fonts** — in `src/app/layout.tsx`, register the three fonts with `next/font/google` and expose them as CSS variables on `<body>`. Replace the existing font setup with:
```tsx
import type { Metadata } from 'next';
import { Outfit, Work_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const heading = Outfit({ subsets: ['latin'], variable: '--font-heading' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });
const mono = Space_Grotesk({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Daily Flow',
  description: 'Nối đường, lấp đầy bảng — puzzle mỗi ngày.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${heading.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
```
(If the generated `layout.tsx` imported Geist fonts, remove those imports.)

- [ ] **Step 4: Verify it compiles** — Run: `pnpm build`
Expected: build succeeds (no TypeScript or font errors). If the default `src/app/page.tsx` references removed font classes, that's fine — it's replaced in Task 7; if the build fails ONLY because of that, you may temporarily simplify `page.tsx` to `export default function Home(){return null;}` and note it (Task 7 finalizes it).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(ui): theme tokens, layout fonts, test deps"
```

---

### Task 2: Color palette + colorblind glyphs

**Files:** Create `src/ui/palette.ts`, `src/ui/palette.test.ts`

- [ ] **Step 1: Write the failing test** — `src/ui/palette.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { flowColor, flowGlyph, FLOW_COLORS } from './palette';

describe('palette', () => {
  it('maps color index to a hex string', () => {
    expect(flowColor(0)).toBe('#E5484D');
    expect(flowColor(1)).toBe('#4C6EF5');
  });
  it('wraps around when index exceeds palette size', () => {
    expect(flowColor(FLOW_COLORS.length)).toBe(flowColor(0));
  });
  it('gives a non-empty glyph per color (colorblind aid)', () => {
    expect(flowGlyph(0).length).toBeGreaterThan(0);
    expect(flowGlyph(2)).not.toBe(flowGlyph(0));
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/ui/palette.test.ts` — Expected: FAIL, cannot find module `./palette`.

- [ ] **Step 3: Write implementation** — `src/ui/palette.ts`:
```ts
export const FLOW_COLORS = [
  '#E5484D', '#4C6EF5', '#22C55E', '#FACC15',
  '#F97316', '#22D3EE', '#EC4899', '#A855F7',
] as const;

export const FLOW_GLYPHS = ['▲', '●', '■', '◆', '✚', '◗', '★', '✦'] as const;

export const flowColor = (i: number): string => FLOW_COLORS[((i % FLOW_COLORS.length) + FLOW_COLORS.length) % FLOW_COLORS.length];
export const flowGlyph = (i: number): string => FLOW_GLYPHS[((i % FLOW_GLYPHS.length) + FLOW_GLYPHS.length) % FLOW_GLYPHS.length];
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/ui/palette.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/ui/palette.ts src/ui/palette.test.ts
git commit -m "feat(ui): flow color palette and colorblind glyphs"
```

---

### Task 3: Pointer geometry helpers (pure)

**Files:** Create `src/ui/geometry.ts`, `src/ui/geometry.test.ts`

`pointToCell` converts a local pixel point inside the board into a grid cell (or null if outside). `stepsToward` returns the orthogonally-adjacent cells from `head` (exclusive) to `target`, moving along X then Y — used to interpolate fast pointer drags into single-cell steps the reducer accepts.

- [ ] **Step 1: Write the failing test** — `src/ui/geometry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pointToCell, stepsToward } from './geometry';

describe('pointToCell', () => {
  it('maps a point to its cell', () => {
    expect(pointToCell(10, 10, 50, [3, 3])).toEqual([0, 0]);
    expect(pointToCell(120, 60, 50, [3, 3])).toEqual([2, 1]);
  });
  it('returns null outside the grid', () => {
    expect(pointToCell(160, 10, 50, [3, 3])).toBeNull(); // col 3 out of bounds
    expect(pointToCell(-1, 10, 50, [3, 3])).toBeNull();
  });
  it('returns null for non-positive cell size', () => {
    expect(pointToCell(10, 10, 0, [3, 3])).toBeNull();
  });
});

describe('stepsToward', () => {
  it('walks X then Y in single steps', () => {
    expect(stepsToward([0, 0], [2, 1])).toEqual([[1, 0], [2, 0], [2, 1]]);
  });
  it('handles same cell', () => {
    expect(stepsToward([1, 1], [1, 1])).toEqual([]);
  });
  it('handles negative direction', () => {
    expect(stepsToward([2, 2], [1, 2])).toEqual([[1, 2]]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/ui/geometry.test.ts` — Expected: FAIL, cannot find module `./geometry`.

- [ ] **Step 3: Write implementation** — `src/ui/geometry.ts`:
```ts
import type { Coord, Size } from '../engine/types';

export function pointToCell(localX: number, localY: number, cellPx: number, size: Size): Coord | null {
  if (cellPx <= 0) return null;
  const col = Math.floor(localX / cellPx);
  const row = Math.floor(localY / cellPx);
  if (col < 0 || row < 0 || col >= size[0] || row >= size[1]) return null;
  return [col, row];
}

export function stepsToward(head: Coord, target: Coord): Coord[] {
  const steps: Coord[] = [];
  let x = head[0];
  let y = head[1];
  while (x !== target[0]) { x += target[0] > x ? 1 : -1; steps.push([x, y]); }
  while (y !== target[1]) { y += target[1] > y ? 1 : -1; steps.push([x, y]); }
  return steps;
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/ui/geometry.test.ts` — Expected: PASS (6 tests).

- [ ] **Step 5: Commit**
```bash
git add src/ui/geometry.ts src/ui/geometry.test.ts
git commit -m "feat(ui): pure pointer-to-cell geometry and drag interpolation"
```

---

### Task 4: Level loader (fetch packs)

**Files:** Create `src/game/level-loader.ts`, `src/game/level-loader.test.ts`

Loads `manifest.json` then each `bucket-<n>.json` from `public/levels/`, flattens, and orders by difficulty via the existing `endlessOrder`. Tested with a mocked `fetch` (node env).

- [ ] **Step 1: Write the failing test** — `src/game/level-loader.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadEndlessPuzzles } from './level-loader';
import type { Puzzle } from '../engine/types';

const mk = (id: string, difficulty: number): Puzzle => ({ id, size: [5, 5], difficulty, pairs: [] });

afterEach(() => vi.unstubAllGlobals());

describe('loadEndlessPuzzles', () => {
  it('fetches manifest + buckets and returns difficulty-ordered puzzles', async () => {
    const responses: Record<string, unknown> = {
      '/levels/manifest.json': { total: 3, buckets: [5, 6] },
      '/levels/bucket-5.json': [mk('b', 5), mk('a', 5)],
      '/levels/bucket-6.json': [mk('c', 6)],
    };
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({ json: () => Promise.resolve(responses[url]) })));
    const out = await loadEndlessPuzzles();
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c']); // diff 5 (a,b) then 6 (c)
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/level-loader.test.ts` — Expected: FAIL, cannot find module `./level-loader`.

- [ ] **Step 3: Write implementation** — `src/game/level-loader.ts`:
```ts
import type { Puzzle } from '../engine/types';
import { endlessOrder } from './level-repository';

interface Manifest { total: number; buckets: number[]; }

export async function loadEndlessPuzzles(base = '/levels'): Promise<Puzzle[]> {
  const manifest = (await (await fetch(`${base}/manifest.json`)).json()) as Manifest;
  const lists = await Promise.all(
    manifest.buckets.map(async (b) => (await (await fetch(`${base}/bucket-${b}.json`)).json()) as Puzzle[]),
  );
  return endlessOrder(lists.flat());
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/level-loader.test.ts` — Expected: PASS (1 test).

- [ ] **Step 5: Commit**
```bash
git add src/game/level-loader.ts src/game/level-loader.test.ts
git commit -m "feat(game): level loader (manifest + buckets -> ordered puzzles)"
```

---

### Task 5: Board SVG component

**Files:** Create `src/ui/Board.tsx`, `src/ui/Board.test.tsx`

Presentational only. Renders: faint dots on empty cells, a thick rounded poly-line per color path (length ≥ 2), and endpoint circles with a colorblind glyph. Pointer handlers + `svgRef` are passed in by the hook (Task 6). `touch-action: none` prevents scroll-jank while dragging.

- [ ] **Step 1: Write the failing test** — `src/ui/Board.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Board } from './Board';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

afterEach(cleanup);

const puzzle: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('Board', () => {
  it('renders an svg with one endpoint circle per endpoint (4)', () => {
    const { getByTestId } = render(<Board puzzle={puzzle} state={createPlayState(puzzle)} />);
    const svg = getByTestId('board');
    // 4 endpoints -> at least 4 endpoint circles (plus empty-cell dots)
    expect(svg.querySelectorAll('[data-ep]').length).toBe(4);
  });
  it('renders a path element when a color has a drawn line', () => {
    const state = createPlayState(puzzle);
    state.paths[0] = [[0, 0], [1, 0]];
    const { getByTestId } = render(<Board puzzle={puzzle} state={state} />);
    expect(getByTestId('board').querySelectorAll('path').length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/ui/Board.test.tsx` — Expected: FAIL, cannot find module `./Board`.

- [ ] **Step 3: Write implementation** — `src/ui/Board.tsx`:
```tsx
'use client';
import type { PointerEvent, Ref } from 'react';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';
import { key } from '../engine/grid';
import { flowColor, flowGlyph } from './palette';

const U = 100;
const c = (n: number): number => n * U + U / 2;

interface BoardProps {
  puzzle: Puzzle;
  state: PlayState;
  showGlyphs?: boolean;
  svgRef?: Ref<SVGSVGElement>;
  onPointerDown?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: PointerEvent<SVGSVGElement>) => void;
}

export function Board({ puzzle, state, showGlyphs = true, svgRef, onPointerDown, onPointerMove, onPointerUp }: BoardProps) {
  const [w, h] = puzzle.size;
  const filled = new Set<string>();
  for (const cells of Object.values(state.paths)) for (const cell of cells) filled.add(key(cell));

  return (
    <svg
      ref={svgRef}
      data-testid="board"
      viewBox={`0 0 ${w * U} ${h * U}`}
      style={{ touchAction: 'none', width: '100%', height: 'auto', display: 'block' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {Array.from({ length: h }).flatMap((_, y) =>
        Array.from({ length: w }).map((_, x) =>
          filled.has(`${x},${y}`) ? null : <circle key={`d${x}-${y}`} cx={c(x)} cy={c(y)} r={6} fill="#D7DCE6" />,
        ),
      )}
      {Object.keys(state.paths).map((ci) => {
        const cells = state.paths[Number(ci)];
        if (cells.length < 2) return null;
        const d = cells.map((p, i) => `${i === 0 ? 'M' : 'L'} ${c(p[0])} ${c(p[1])}`).join(' ');
        return (
          <path key={`p${ci}`} d={d} fill="none" stroke={flowColor(Number(ci))} strokeWidth={U * 0.32} strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
      {puzzle.pairs.flatMap((pair) =>
        [pair.a, pair.b].map((p, idx) => (
          <g key={`e${pair.color}-${idx}`}>
            <circle data-ep cx={c(p[0])} cy={c(p[1])} r={U * 0.34} fill={flowColor(pair.color)} />
            {showGlyphs && (
              <text x={c(p[0])} y={c(p[1])} textAnchor="middle" dominantBaseline="central" fontSize={U * 0.32} fill="#fff">
                {flowGlyph(pair.color)}
              </text>
            )}
          </g>
        )),
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/ui/Board.test.tsx` — Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/ui/Board.tsx src/ui/Board.test.tsx
git commit -m "feat(ui): presentational SVG board with colorblind glyphs"
```

---

### Task 6: useFlowBoard hook

**Files:** Create `src/ui/useFlowBoard.ts`, `src/ui/useFlowBoard.test.tsx`

Holds `PlayState`, exposes pointer handlers that map events → cells (via `getBoundingClientRect` + `pointToCell`) and drive the reducer, interpolating fast drags with `stepsToward`. Also `undo` (history stack), `reset`, and `won`. Tests cover only the DOM-independent behavior (initial/solved/reset) — geometry is verified at dev-run.

- [ ] **Step 1: Write the failing test** — `src/ui/useFlowBoard.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowBoard } from './useFlowBoard';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

const puzzle: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('useFlowBoard', () => {
  it('starts not won', () => {
    const { result } = renderHook(() => useFlowBoard(puzzle));
    expect(result.current.won).toBe(false);
  });
  it('reports won when seeded with a solved state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { result } = renderHook(() => useFlowBoard(puzzle, solved));
    expect(result.current.won).toBe(true);
  });
  it('reset returns to an empty, not-won state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { result } = renderHook(() => useFlowBoard(puzzle, solved));
    act(() => result.current.reset());
    expect(result.current.won).toBe(false);
    expect(result.current.state.paths[0]).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/ui/useFlowBoard.test.tsx` — Expected: FAIL, cannot find module `./useFlowBoard`.

- [ ] **Step 3: Write implementation** — `src/ui/useFlowBoard.ts`:
```ts
'use client';
import { useCallback, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Puzzle, Coord } from '../engine/types';
import { createPlayState, beginAt, extendTo, endDrag, isWon, type PlayState } from '../game/play-state';
import { pointToCell, stepsToward } from './geometry';

const U = 100;

export function useFlowBoard(puzzle: Puzzle, initial?: PlayState) {
  const [state, setState] = useState<PlayState>(() => initial ?? createPlayState(puzzle));
  const history = useRef<PlayState[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const cellFromEvent = useCallback(
    (e: PointerEvent<SVGSVGElement>): Coord | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const localX = ((e.clientX - rect.left) / rect.width) * puzzle.size[0] * U;
      const localY = ((e.clientY - rect.top) / rect.height) * puzzle.size[1] * U;
      return pointToCell(localX, localY, U, puzzle.size);
    },
    [puzzle],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const cell = cellFromEvent(e);
      if (!cell) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      history.current.push(state);
      setState((s) => beginAt(s, puzzle, cell));
    },
    [cellFromEvent, puzzle, state],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      setState((s) => {
        if (s.active === null) return s;
        const cell = cellFromEvent(e);
        if (!cell) return s;
        const path = s.paths[s.active];
        const head = path[path.length - 1];
        let next = s;
        for (const step of stepsToward(head, cell)) next = extendTo(next, puzzle, step);
        return next;
      });
    },
    [cellFromEvent, puzzle],
  );

  const onPointerUp = useCallback(() => setState((s) => endDrag(s)), []);
  const reset = useCallback(() => {
    history.current = [];
    setState(createPlayState(puzzle));
  }, [puzzle]);
  const undo = useCallback(() => setState((s) => history.current.pop() ?? s), []);

  return { state, svgRef, onPointerDown, onPointerMove, onPointerUp, reset, undo, won: isWon(puzzle, state) };
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/ui/useFlowBoard.test.tsx` — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/ui/useFlowBoard.ts src/ui/useFlowBoard.test.tsx
git commit -m "feat(ui): useFlowBoard hook wiring pointer events to the reducer"
```

---

### Task 7: EndlessGame screen + home page

**Files:** Create `src/ui/EndlessGame.tsx`, `src/ui/EndlessGame.test.tsx`; modify `src/app/page.tsx`

`EndlessGame` renders the current puzzle (remounting via `key` on puzzle id so a fresh play-state starts per puzzle), Undo/Reset controls, and a win overlay with a "Next" button that advances through the puzzle list. The home page loads packs and renders it.

- [ ] **Step 1: Write the failing test** — `src/ui/EndlessGame.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { EndlessGame } from './EndlessGame';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

afterEach(cleanup);

const puzzle: Puzzle = {
  id: 't1', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('EndlessGame', () => {
  it('renders the board and controls', () => {
    const { getByTestId, getByText } = render(<EndlessGame puzzles={[puzzle]} />);
    expect(getByTestId('board')).toBeTruthy();
    expect(getByText('Undo')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });
  it('shows a win overlay when seeded with a solved state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { getByRole } = render(<EndlessGame puzzles={[puzzle]} initialState={solved} />);
    expect(getByRole('dialog')).toBeTruthy();
  });
  it('advancing past the last puzzle shows an end message', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { getByText } = render(<EndlessGame puzzles={[puzzle]} initialState={solved} />);
    fireEvent.click(getByText('Màn tiếp'));
    expect(getByText('Hết màn — quay lại sau nhé!')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/ui/EndlessGame.test.tsx` — Expected: FAIL, cannot find module `./EndlessGame`.

- [ ] **Step 3: Write implementation** — `src/ui/EndlessGame.tsx`:
```tsx
'use client';
import { useState } from 'react';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';

function BoardGame({ puzzle, initialState, onNext }: { puzzle: Puzzle; initialState?: PlayState; onNext: () => void }) {
  const b = useFlowBoard(puzzle, initialState);
  return (
    <>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board
            puzzle={puzzle}
            state={b.state}
            svgRef={b.svgRef}
            onPointerDown={b.onPointerDown}
            onPointerMove={b.onPointerMove}
            onPointerUp={b.onPointerUp}
          />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Undo</button>
        <button className="df-btn" onClick={b.reset}>Reset</button>
      </div>
      {b.won && (
        <div className="df-win" role="dialog" aria-label="Hoàn thành">
          <div className="df-win-card">
            <p className="df-title" style={{ fontSize: 24, margin: '0 0 12px' }}>Hoàn thành! 🎉</p>
            <button className="df-btn df-cta" onClick={onNext}>Màn tiếp</button>
          </div>
        </div>
      )}
    </>
  );
}

export function EndlessGame({ puzzles, initialState }: { puzzles: Puzzle[]; initialState?: PlayState }) {
  const [index, setIndex] = useState(0);
  const puzzle = puzzles[index];
  if (!puzzle) {
    return (
      <div className="df-board-wrap">
        <p className="df-title">Hết màn — quay lại sau nhé!</p>
      </div>
    );
  }
  return (
    <BoardGame
      key={puzzle.id}
      puzzle={puzzle}
      initialState={index === 0 ? initialState : undefined}
      onNext={() => setIndex((i) => i + 1)}
    />
  );
}
```

- [ ] **Step 4: Wire the home page** — replace `src/app/page.tsx` with:
```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { EndlessGame } from '../ui/EndlessGame';

export default function Home() {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadEndlessPuzzles().then(setPuzzles).catch(() => setFailed(true));
  }, []);

  return (
    <main className="df-shell">
      <header style={{ padding: '20px 0 4px' }}>
        <span className="df-title" style={{ fontSize: 22 }}>Daily Flow</span>
        <p style={{ color: 'var(--muted)', margin: '2px 0 0', fontSize: 13 }}>Nối hai chấm cùng màu · lấp đầy bảng</p>
      </header>
      {failed && <p style={{ color: 'var(--muted)' }}>Không tải được màn chơi.</p>}
      {!failed && !puzzles && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}
      {puzzles && <EndlessGame puzzles={puzzles} />}
    </main>
  );
}
```

- [ ] **Step 5: Run tests + full suite**
Run: `pnpm vitest run src/ui/EndlessGame.test.tsx` — Expected: PASS (3 tests).
Run: `pnpm test` — Expected: ALL test files pass. Report total.

- [ ] **Step 6: Commit**
```bash
git add src/ui/EndlessGame.tsx src/ui/EndlessGame.test.tsx src/app/page.tsx
git commit -m "feat(ui): Endless game screen and home page wiring"
```

---

### Task 8: Build + dev-run verification

**Files:** none (verification only)

- [ ] **Step 1: Production build** — Run: `pnpm build`
Expected: build succeeds with no type errors. If it fails, fix the reported issue (do not disable type checking) and report what changed.

- [ ] **Step 2: Start the dev server in the background**
```bash
pnpm dev &
```
Wait ~5s, then verify it serves:
```bash
sleep 6 && curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
Expected: `200`. Also fetch a level pack to confirm packs are served:
```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/levels/manifest.json
```
Expected: `200`.

- [ ] **Step 3: Report** — Report the dev URL (http://localhost:3000), the two HTTP status codes, and STOP the background dev server if you started one only for the check (`kill %1` or leave it running and say so). Do not commit anything in this task.

---

## Self-review (against spec §6–§7)

- **SVG board, mobile-first, color pops on lines over calm canvas:** `Board.tsx` + theme tokens. ✓
- **Colorblind glyphs on endpoints (mandatory from MVP):** `flowGlyph` rendered in `Board`. ✓
- **Touch/one-hand drag, no scroll-jank:** `touch-action: none`, pointer capture, thumb-zone `.df-controls` at the bottom. ✓
- **Fast-drag correctness:** `stepsToward` interpolation feeds single adjacent steps to the reducer. ✓
- **Endless mode loads generated packs, advances by difficulty:** `loadEndlessPuzzles` + `endlessOrder` + `EndlessGame` index. ✓
- **Win feedback:** win overlay (`role="dialog"`). ✓
- **Undo/Reset:** hook history + `reset`. ✓
- **Type/name consistency:** reuses `Puzzle/Coord/Size`, `PlayState`, reducer fns, `endlessOrder`; `U=100` shared by `Board` and hook. ✓
- **jsdom limitation respected:** geometry tested purely; event-geometry verified via dev run (Task 8); `cellFromEvent` guards `rect.width === 0`. ✓
- **Deferred & noted:** Daily/streak/share/Hint/onboarding/auto-ramp — future phases.
