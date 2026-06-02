# Daily Flow — Phase 1a: Play Logic + Level Repository — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the runtime "play" core of Daily Flow — a pure, framework-free play-state reducer that turns drag gestures into flow paths (extend, backtrack, cut/overwrite, complete, win) plus a level repository that selects the Daily puzzle by date and orders Endless puzzles by difficulty. Fully unit-tested, no browser.

**Architecture:** Pure TypeScript in `src/game/`, building on the existing `src/engine/` (grid, validate, types). The reducer holds in-progress paths per color and exposes pure transition functions (`beginAt`, `extendTo`, `endDrag`) that Phase 1b's React component will wire to pointer events. Win detection reuses the engine's `isSolved`. The repository contains only pure selection logic; actual JSON fetching is a thin loader added in Phase 1b.

**Tech Stack:** TypeScript, Vitest (already configured), pnpm. No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-06-02-daily-flow-design.md` (§2 Gameplay, §3 Modes).

**Builds on Phase 0 (already on `main`):** `src/engine/types.ts` (`Coord`, `Size`, `Pair`, `Puzzle`, `Line`, `Solution`), `src/engine/grid.ts` (`key`, `eq`, `inBounds`, `neighbors`, `adjacent`, `allCells`), `src/engine/validate.ts` (`isContiguous`, `isSolved`).

---

## Branching

Start this phase on a fresh branch off `main`:
```bash
git checkout main && git pull
git checkout -b feat/phase-1a-play-logic
```
(If `git pull` fails because the remote has nothing new, ignore — continue.)

## Locked types & signatures (used across all tasks)

```ts
// src/game/play-state.ts
export interface PlayState {
  paths: Record<number, Coord[]>; // colorIndex -> ordered cells, endpoints inclusive
  active: number | null;          // color currently being drawn (null when idle)
}
```
- `createPlayState(puzzle: Puzzle): PlayState`
- `linesFromState(state: PlayState): Line[]`
- `isWon(puzzle: Puzzle, state: PlayState): boolean`
- `beginAt(state: PlayState, puzzle: Puzzle, cell: Coord): PlayState`
- `extendTo(state: PlayState, puzzle: Puzzle, cell: Coord): PlayState`
- `endDrag(state: PlayState): PlayState`

```ts
// src/game/level-repository.ts
export interface DailyEntry { date: string; id: string; }
```
- `indexById(puzzles: Puzzle[]): Map<string, Puzzle>`
- `dailyDateISO(now: Date): string`            // local YYYY-MM-DD (daily resets at local midnight)
- `puzzleForDate(schedule: DailyEntry[], byId: Map<string, Puzzle>, dateISO: string): Puzzle | null`
- `endlessOrder(puzzles: Puzzle[]): Puzzle[]`   // ascending difficulty, then id

**All transition functions are PURE:** they return a new `PlayState` and never mutate the input. Reducer files stay under 200 lines.

---

## File structure

```
src/game/
  level-repository.ts        # pure puzzle selection (daily by date, endless order)
  level-repository.test.ts
  play-state.ts              # pure play reducer (begin/extend/end, win)
  play-state.test.ts
```

---

### Task 1: Level repository

**Files:** Create `src/game/level-repository.ts`, `src/game/level-repository.test.ts`

- [ ] **Step 1: Write the failing test** — `src/game/level-repository.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/level-repository.test.ts` — Expected: FAIL, cannot find module `./level-repository`.

- [ ] **Step 3: Write implementation** — `src/game/level-repository.ts`:
```ts
import type { Puzzle } from '../engine/types';

export interface DailyEntry { date: string; id: string; }

export function indexById(puzzles: Puzzle[]): Map<string, Puzzle> {
  return new Map(puzzles.map((p) => [p.id, p]));
}

export function dailyDateISO(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function puzzleForDate(
  schedule: DailyEntry[],
  byId: Map<string, Puzzle>,
  dateISO: string,
): Puzzle | null {
  const entry = schedule.find((e) => e.date === dateISO);
  if (!entry) return null;
  return byId.get(entry.id) ?? null;
}

export function endlessOrder(puzzles: Puzzle[]): Puzzle[] {
  return [...puzzles].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/level-repository.test.ts` — Expected: PASS (5 tests).

- [ ] **Step 5: Commit**
```bash
git add src/game/level-repository.ts src/game/level-repository.test.ts
git commit -m "feat(game): level repository (daily-by-date, endless ordering)"
```

---

### Task 2: Play-state core (create, lines, win)

**Files:** Create `src/game/play-state.ts`, `src/game/play-state.test.ts`

- [ ] **Step 1: Write the failing test** — `src/game/play-state.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createPlayState, linesFromState, isWon } from './play-state';
import type { Puzzle } from '../engine/types';

const puzzle2x2: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('createPlayState', () => {
  it('starts with an empty path per color and no active color', () => {
    const s = createPlayState(puzzle2x2);
    expect(s.active).toBeNull();
    expect(s.paths).toEqual({ 0: [], 1: [] });
  });
});

describe('linesFromState + isWon', () => {
  it('a fresh state is not won', () => {
    expect(isWon(puzzle2x2, createPlayState(puzzle2x2))).toBe(false);
  });
  it('a fully and correctly filled state is won', () => {
    const s = createPlayState(puzzle2x2);
    s.paths[0] = [[0, 0], [1, 0]];
    s.paths[1] = [[0, 1], [1, 1]];
    expect(linesFromState(s)).toEqual([
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ]);
    expect(isWon(puzzle2x2, s)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: FAIL, cannot find module `./play-state`.

- [ ] **Step 3: Write implementation** — `src/game/play-state.ts`:
```ts
import type { Puzzle, Coord, Line } from '../engine/types';
import { eq, adjacent } from '../engine/grid';
import { isSolved } from '../engine/validate';

export interface PlayState {
  paths: Record<number, Coord[]>;
  active: number | null;
}

export function createPlayState(puzzle: Puzzle): PlayState {
  const paths: Record<number, Coord[]> = {};
  for (const p of puzzle.pairs) paths[p.color] = [];
  return { paths, active: null };
}

export function linesFromState(state: PlayState): Line[] {
  return Object.keys(state.paths).map((c) => ({ color: Number(c), cells: state.paths[Number(c)] }));
}

export function isWon(puzzle: Puzzle, state: PlayState): boolean {
  return isSolved(puzzle, linesFromState(state));
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/game/play-state.ts src/game/play-state.test.ts
git commit -m "feat(game): play-state core (create, lines, win detection)"
```

---

### Task 3: beginAt (grab an endpoint or a drawn path)

Append to `src/game/play-state.ts`. `beginAt` starts/continues a color's drag: grabbing one of a color's endpoints resets that color's path to `[endpoint]` and makes it active; grabbing a cell already on some color's path truncates that path to the grabbed cell and makes it active; grabbing an empty non-endpoint cell sets `active = null`. Pure (clones input).

**Files:** Modify `src/game/play-state.ts`; modify `src/game/play-state.test.ts`

- [ ] **Step 1: Add the failing tests** — append inside `src/game/play-state.test.ts`:
```ts
import { beginAt } from './play-state';

describe('beginAt', () => {
  it('grabbing an endpoint starts that color fresh', () => {
    const s = beginAt(createPlayState(puzzle2x2), puzzle2x2, [0, 0]);
    expect(s.active).toBe(0);
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('grabbing a drawn cell truncates that color to it and reactivates', () => {
    let s = createPlayState(puzzle2x2);
    s.paths[0] = [[0, 0], [1, 0]];
    s = beginAt(s, puzzle2x2, [0, 0]); // grab the start endpoint
    expect(s.active).toBe(0);
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('grabbing an empty non-endpoint cell deactivates', () => {
    // 3x3 so [1,1] is a non-endpoint empty cell
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    const s = beginAt(createPlayState(p3), p3, [1, 1]);
    expect(s.active).toBeNull();
  });
  it('does not mutate the input state', () => {
    const before = createPlayState(puzzle2x2);
    beginAt(before, puzzle2x2, [0, 0]);
    expect(before.paths[0]).toEqual([]);
    expect(before.active).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: FAIL, `beginAt` is not exported.

- [ ] **Step 3: Add the implementation** — append to `src/game/play-state.ts`:
```ts
const endpointColorAt = (puzzle: Puzzle, cell: Coord): number | null => {
  for (const p of puzzle.pairs) if (eq(p.a, cell) || eq(p.b, cell)) return p.color;
  return null;
};

const ownerColorAt = (state: PlayState, cell: Coord): number | null => {
  for (const c of Object.keys(state.paths)) {
    if (state.paths[Number(c)].some((x) => eq(x, cell))) return Number(c);
  }
  return null;
};

const clone = (state: PlayState): PlayState => ({
  active: state.active,
  paths: Object.fromEntries(Object.keys(state.paths).map((c) => [c, [...state.paths[Number(c)]]])),
});

export function beginAt(state: PlayState, puzzle: Puzzle, cell: Coord): PlayState {
  const next = clone(state);
  const epColor = endpointColorAt(puzzle, cell);
  if (epColor !== null) {
    next.paths[epColor] = [cell];
    next.active = epColor;
    return next;
  }
  const owner = ownerColorAt(state, cell);
  if (owner !== null) {
    const cells = next.paths[owner];
    const idx = cells.findIndex((x) => eq(x, cell));
    next.paths[owner] = cells.slice(0, idx + 1);
    next.active = owner;
    return next;
  }
  next.active = null;
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: PASS (7 tests total).

- [ ] **Step 5: Commit**
```bash
git add src/game/play-state.ts src/game/play-state.test.ts
git commit -m "feat(game): beginAt drag-start logic"
```

---

### Task 4: extendTo (extend, backtrack, block)

Append `extendTo` to `src/game/play-state.ts`. Rules when a color is active with path head `head`: ignore if `cell === head` or not adjacent to `head`; if `cell` is the cell just before the head, **backtrack** (drop the head); if `cell` is already on the active path, **block** (no self-cross); if `cell` is another color's endpoint, **block**; otherwise **extend** (append `cell`). (Overwrite/cut of another color is added in Task 5.)

**Files:** Modify `src/game/play-state.ts`; modify `src/game/play-state.test.ts`

- [ ] **Step 1: Add the failing tests** — append inside `src/game/play-state.test.ts`:
```ts
import { extendTo } from './play-state';

describe('extendTo (extend / backtrack / block)', () => {
  const start = (): ReturnType<typeof createPlayState> => beginAt(createPlayState(puzzle2x2), puzzle2x2, [0, 0]);
  it('extends to an adjacent free cell', () => {
    const s = extendTo(start(), puzzle2x2, [1, 0]); // [1,0] is color 0's other endpoint -> allowed
    expect(s.paths[0]).toEqual([[0, 0], [1, 0]]);
  });
  it('ignores a non-adjacent cell', () => {
    const s = extendTo(start(), puzzle2x2, [1, 1]); // diagonal from [0,0]
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('backtracks when moving onto the previous cell', () => {
    let s = start();
    s = extendTo(s, puzzle2x2, [0, 1]); // extend down ([0,1] is color1 endpoint -> blocked!)
    // [0,1] is color 1's endpoint, so extend is blocked; use a 3x3 for a clean backtrack
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    let t = beginAt(createPlayState(p3), p3, [0, 0]);
    t = extendTo(t, p3, [1, 0]); // [[0,0],[1,0]]
    t = extendTo(t, p3, [0, 0]); // back onto previous -> drop head
    expect(t.paths[0]).toEqual([[0, 0]]);
  });
  it("blocks stepping onto another color's endpoint", () => {
    const s = extendTo(start(), puzzle2x2, [0, 1]); // [0,1] is color 1's endpoint
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('blocks self-crossing', () => {
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    let t = beginAt(createPlayState(p3), p3, [0, 0]);
    t = extendTo(t, p3, [1, 0]);
    t = extendTo(t, p3, [1, 1]);
    t = extendTo(t, p3, [0, 1]);
    t = extendTo(t, p3, [0, 0]); // [0,0] already on path -> block (not adjacent to head [0,1]? it is adjacent)
    expect(t.paths[0]).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: FAIL, `extendTo` is not exported.

- [ ] **Step 3: Add the implementation** — append to `src/game/play-state.ts`:
```ts
export function extendTo(state: PlayState, puzzle: Puzzle, cell: Coord): PlayState {
  if (state.active === null) return state;
  const C = state.active;
  const path = state.paths[C];
  if (path.length === 0) return state;
  const head = path[path.length - 1];
  if (eq(cell, head)) return state;
  if (!adjacent(cell, head)) return state;
  if (path.length >= 2 && eq(cell, path[path.length - 2])) {
    const next = clone(state);
    next.paths[C] = path.slice(0, -1); // backtrack
    return next;
  }
  if (path.some((x) => eq(x, cell))) return state; // no self-cross
  const epColor = endpointColorAt(puzzle, cell);
  if (epColor !== null && epColor !== C) return state; // not another color's endpoint
  const next = clone(state);
  next.paths[C] = [...path, cell];
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**
```bash
git add src/game/play-state.ts src/game/play-state.test.ts
git commit -m "feat(game): extendTo extend/backtrack/block logic"
```

---

### Task 5: extendTo overwrite (cut another color) + endDrag

Enhance `extendTo` so that extending into a cell occupied by ANOTHER color's path (a non-endpoint cell — endpoints are already blocked) **cuts** that color's path at the shared cell (removes that cell and everything after it), then claims the cell. Add `endDrag` to clear `active`.

**Files:** Modify `src/game/play-state.ts`; modify `src/game/play-state.test.ts`

- [ ] **Step 1: Add the failing tests** — append inside `src/game/play-state.test.ts`:
```ts
import { endDrag } from './play-state';

describe('extendTo overwrite + endDrag', () => {
  const p3two: Puzzle = {
    id: 'p3two', size: [3, 3], difficulty: 1,
    pairs: [
      { color: 0, a: [0, 0], b: [2, 0] },
      { color: 1, a: [0, 2], b: [2, 2] },
    ],
  };
  it("cuts another color's path at the overwritten cell", () => {
    let s = createPlayState(p3two);
    s.paths[0] = [[0, 0], [1, 0], [1, 1]]; // color 0 drawn down into the middle
    s = { ...s, active: 1, paths: { ...s.paths, 1: [[0, 2], [1, 2]] } };
    s = extendTo(s, p3two, [1, 1]); // color 1 steps into color 0's [1,1]
    expect(s.paths[1]).toEqual([[0, 2], [1, 2], [1, 1]]);
    expect(s.paths[0]).toEqual([[0, 0], [1, 0]]); // cut at [1,1]
  });
  it('endDrag clears the active color', () => {
    const s = endDrag({ active: 1, paths: { 0: [], 1: [[0, 2]] } });
    expect(s.active).toBeNull();
    expect(s.paths[1]).toEqual([[0, 2]]); // paths untouched
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: FAIL (`endDrag` not exported; overwrite assertion fails — current `extendTo` blocks/ignores the occupied cell).

- [ ] **Step 3: Update the implementation** — in `src/game/play-state.ts`, replace the body of `extendTo` from the self-cross line onward so it cuts the other color, and add `endDrag`. The full final `extendTo` + new `endDrag`:
```ts
export function extendTo(state: PlayState, puzzle: Puzzle, cell: Coord): PlayState {
  if (state.active === null) return state;
  const C = state.active;
  const path = state.paths[C];
  if (path.length === 0) return state;
  const head = path[path.length - 1];
  if (eq(cell, head)) return state;
  if (!adjacent(cell, head)) return state;
  if (path.length >= 2 && eq(cell, path[path.length - 2])) {
    const next = clone(state);
    next.paths[C] = path.slice(0, -1); // backtrack
    return next;
  }
  if (path.some((x) => eq(x, cell))) return state; // no self-cross
  const epColor = endpointColorAt(puzzle, cell);
  if (epColor !== null && epColor !== C) return state; // not another color's endpoint
  const next = clone(state);
  const owner = ownerColorAt(state, cell);
  if (owner !== null && owner !== C) {
    const ocells = next.paths[owner];
    const idx = ocells.findIndex((x) => eq(x, cell));
    next.paths[owner] = ocells.slice(0, idx); // cut the overwritten color at the shared cell
  }
  next.paths[C] = [...path, cell];
  return next;
}

export function endDrag(state: PlayState): PlayState {
  const next = clone(state);
  next.active = null;
  return next;
}
```
(Replace the existing `extendTo`; do not leave a duplicate. Keep the file under 200 lines.)

- [ ] **Step 4: Run test to verify it passes** — Run: `pnpm vitest run src/game/play-state.test.ts` — Expected: PASS (14 tests total).

- [ ] **Step 5: Commit**
```bash
git add src/game/play-state.ts src/game/play-state.test.ts
git commit -m "feat(game): extendTo overwrite (cut crossed color) and endDrag"
```

---

### Task 6: Integration — solve a board end-to-end through the reducer

A behavioral test that drives a small puzzle to a win purely through `beginAt` → `extendTo` → `endDrag`, proving the pieces compose and reach `isWon === true`.

**Files:** Create `src/game/play-state.integration.test.ts`

- [ ] **Step 1: Write the test** — `src/game/play-state.integration.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createPlayState, beginAt, extendTo, endDrag, isWon } from './play-state';
import type { Puzzle } from '../engine/types';

// 3x3, two colors, has a unique full-fill solution:
//   color 0: [0,0]-[1,0]-[2,0]-[2,1]-[2,2]   (top row + right column down)
//   color 1: [0,1]-[0,2]-[1,2] ... wait that leaves [1,1]; use the layout below.
// Solution covering all 9 cells:
//   color 0: [0,0],[0,1],[0,2],[1,2],[1,1],[1,0],[2,0]  (snake) endpoints [0,0],[2,0]
//   color 1: [2,1],[2,2]                                   endpoints [2,1],[2,2]
const puzzle: Puzzle = {
  id: 'i3', size: [3, 3], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [2, 0] },
    { color: 1, a: [2, 1], b: [2, 2] },
  ],
};

describe('solving a board through drag operations', () => {
  it('reaches isWon by dragging both colors to completion', () => {
    let s = createPlayState(puzzle);
    expect(isWon(puzzle, s)).toBe(false);

    // draw color 0 as a snake from [0,0] to [2,0] covering 7 cells
    s = beginAt(s, puzzle, [0, 0]);
    for (const c of [[0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0]] as [number, number][]) {
      s = extendTo(s, puzzle, c);
    }
    s = endDrag(s);
    expect(s.paths[0]).toEqual([[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0]]);
    expect(isWon(puzzle, s)).toBe(false); // color 1 not yet drawn

    // draw color 1 from [2,1] to [2,2]
    s = beginAt(s, puzzle, [2, 1]);
    s = extendTo(s, puzzle, [2, 2]);
    s = endDrag(s);

    expect(isWon(puzzle, s)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes** — Run: `pnpm vitest run src/game/play-state.integration.test.ts` — Expected: PASS (1 test). (If it fails, the bug is real — investigate the reducer, do not weaken the test.)

- [ ] **Step 3: Run the full suite**
Run: `pnpm test`
Expected: ALL test files PASS (Phase 0 + Phase 1a). Report the total count.

- [ ] **Step 4: Commit**
```bash
git add src/game/play-state.integration.test.ts
git commit -m "test(game): end-to-end solve through drag reducer"
```

---

## Self-review (against spec §2–§3)

- **Drag to draw / extend a flow:** `extendTo` extend branch. ✓
- **Backtrack by dragging back:** `extendTo` backtrack branch. ✓
- **Overwrite/cut a crossed pipe (classic Flow feel):** `extendTo` owner-cut branch (Task 5). ✓
- **Reach matching endpoint to complete; win = all pairs connected + board full:** `extendTo` allows stepping onto own matching endpoint; `isWon` delegates to engine `isSolved` (full cover + endpoints + no overlap). ✓
- **Daily puzzle selected by date; Endless ordered by difficulty:** `puzzleForDate`, `dailyDateISO` (local midnight reset per spec), `endlessOrder`. ✓
- **Purity (no mutation):** every transition clones via `clone()`; `beginAt` mutation test guards it. ✓
- **Type consistency:** reuses `Coord/Puzzle/Line` from `src/engine/types`; `PlayState` defined once; function names match locked signatures. ✓
- **Deferred to Phase 1b (not this plan):** SVG board rendering, pointer-event wiring + cell hit-testing, fast-drag interpolation between non-adjacent pointer samples, React game screen, controls (undo/hint/reset), theme, localStorage, the actual JSON fetch loader. These are UI concerns; this plan is the pure play core only (YAGNI for 1a).
- **Note:** `extendTo` ignores non-adjacent jumps; Phase 1b's pointer hook must feed adjacent steps (interpolate fast drags). Documented above so 1b accounts for it.
