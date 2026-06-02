# Daily Flow — Phase 0: Engine + Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure-logic foundation of Daily Flow — a game-rules engine (validation + win detection + uniqueness solver) and an offline procedural generator that emits verified, difficulty-bucketed level JSON plus a daily schedule.

**Architecture:** Pure TypeScript domain code in `src/engine/` (shared by the future web app and the generator). A dev-only Node generator in `scripts/generator/` consumes the engine to generate full-cover Numberlink solutions, derive puzzles, verify *unique* solvability with a backtracking solver, score difficulty, and write static JSON packs to `public/levels/`. No UI, no network. TDD with Vitest; deterministic via a seeded RNG.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind (scaffold only this phase), Vitest (tests), tsx (run TS scripts), pnpm.

**Reference spec:** `docs/superpowers/specs/2026-06-02-daily-flow-design.md` (sections 2 Gameplay, 4 Generation).

**Domain glossary:**
- *Puzzle*: the problem — a grid size + list of colored endpoint pairs.
- *Solution / Line*: the answer — each color's full ordered cell path; lines together cover every cell.
- *Unique*: exactly one solution exists that connects all pairs AND fills the whole board (this is what makes a "good" Flow level).

---

## Locked types & signatures (used across all tasks)

```ts
// src/engine/types.ts
export type Coord = [number, number];            // [col, row]
export type Size = [number, number];             // [width, height]
export interface Pair { color: number; a: Coord; b: Coord; }
export interface Puzzle { id: string; size: Size; difficulty: number; pairs: Pair[]; }
export interface Line { color: number; cells: Coord[]; }   // ordered path, cells[0]..cells[n-1]
export interface Solution { lines: Line[]; }
```

Function signatures locked here; do not rename later:
- `key(c: Coord): string` · `eq(a: Coord, b: Coord): boolean` · `inBounds(c: Coord, size: Size): boolean` · `neighbors(c: Coord): Coord[]` · `adjacent(a: Coord, b: Coord): boolean` · `allCells(size: Size): Coord[]`
- `isContiguous(cells: Coord[]): boolean` · `isSolved(puzzle: Puzzle, lines: Line[]): boolean`
- `countSolutions(puzzle: Puzzle, limit?: number): number`
- `mulberry32(seed: number): () => number`
- `generateSolution(size: Size, rng: () => number, maxColors?: number): Solution | null`
- `puzzleFromSolution(solution: Solution, size: Size, id: string, difficulty: number): Puzzle`
- `scoreDifficulty(solution: Solution, size: Size): number`
- `bucketByDifficulty(puzzles: Puzzle[]): Record<number, Puzzle[]>`
- `buildDailySchedule(byBucket: Record<number, Puzzle[]>, startISO: string, days: number): { date: string; id: string }[]`

---

## File structure

```
src/engine/
  types.ts            # shared types (above)
  grid.ts             # coord helpers
  validate.ts         # isContiguous, isSolved (win detection)
  solver.ts           # countSolutions (uniqueness via backtracking)
scripts/generator/
  rng.ts              # mulberry32 seeded RNG
  generate-solution.ts# random full-cover path partition
  derive-puzzle.ts    # endpoints from a solution
  score-difficulty.ts # heuristic difficulty 1..10
  package.ts          # bucketByDifficulty, buildDailySchedule
  cli.ts              # orchestrate -> write public/levels/*.json
public/levels/        # generated output (committed)
```
Each source file stays under 200 lines.

---

### Task 1: Scaffold project + tooling + git

**Files:**
- Create: whole Next.js project in repo root, plus `vitest.config.ts`, npm scripts.

- [ ] **Step 1: Initialize git**

Run:
```bash
cd /Users/kittodekiru/Desktop/WorkSync/Company/WeUP/projects/flow_free_game
git init
printf "node_modules/\n.next/\n.DS_Store\n*.log\n" > .gitignore
```

- [ ] **Step 2: Scaffold Next.js into a temp dir, then merge (root has docs/ & mockups/ so create-next-app refuses a non-empty root)**

Run:
```bash
cd /Users/kittodekiru/Desktop/WorkSync/Company/WeUP/projects
pnpm dlx create-next-app@latest daily-flow-tmp --ts --tailwind --app --src-dir --eslint --use-pnpm --no-import-alias --no-turbopack --yes
# merge generated project into our repo root, keeping existing docs/ & mockups/
rsync -a --exclude='.git' daily-flow-tmp/ flow_free_game/
rm -rf daily-flow-tmp
cd flow_free_game
```
Expected: repo root now has `package.json`, `src/app/`, `tsconfig.json`, `tailwind` config, alongside existing `docs/` and `mockups/`.

- [ ] **Step 3: Add test + script tooling**

Run:
```bash
pnpm add -D vitest tsx
```
Then create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
```
Add scripts to `package.json` (`"scripts"` block):
```json
"test": "vitest run",
"test:watch": "vitest",
"gen": "tsx scripts/generator/cli.ts"
```

- [ ] **Step 4: Verify toolchain**

Run: `pnpm test`
Expected: Vitest runs, reports "No test files found" (exit 0) — toolchain works.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with vitest and tsx tooling"
```

---

### Task 2: Engine types + grid helpers

**Files:**
- Create: `src/engine/types.ts`, `src/engine/grid.ts`, `src/engine/grid.test.ts`

- [ ] **Step 1: Write the failing test**

`src/engine/grid.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { key, eq, inBounds, neighbors, adjacent, allCells } from './grid';

describe('grid helpers', () => {
  it('key + eq', () => {
    expect(key([2, 3])).toBe('2,3');
    expect(eq([1, 1], [1, 1])).toBe(true);
    expect(eq([1, 1], [1, 2])).toBe(false);
  });
  it('inBounds', () => {
    expect(inBounds([0, 0], [3, 3])).toBe(true);
    expect(inBounds([3, 0], [3, 3])).toBe(false);
    expect(inBounds([-1, 0], [3, 3])).toBe(false);
  });
  it('neighbors are the 4 orthogonal cells', () => {
    expect(neighbors([1, 1]).sort()).toEqual([[0, 1], [1, 0], [1, 2], [2, 1]].sort());
  });
  it('adjacent', () => {
    expect(adjacent([1, 1], [1, 2])).toBe(true);
    expect(adjacent([1, 1], [2, 2])).toBe(false);
  });
  it('allCells lists every cell row-major', () => {
    expect(allCells([2, 2])).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/grid.test.ts`
Expected: FAIL — cannot find module `./grid`.

- [ ] **Step 3: Write implementation**

`src/engine/types.ts`:
```ts
export type Coord = [number, number];
export type Size = [number, number];
export interface Pair { color: number; a: Coord; b: Coord; }
export interface Puzzle { id: string; size: Size; difficulty: number; pairs: Pair[]; }
export interface Line { color: number; cells: Coord[]; }
export interface Solution { lines: Line[]; }
```
`src/engine/grid.ts`:
```ts
import type { Coord, Size } from './types';

export const key = (c: Coord): string => `${c[0]},${c[1]}`;
export const eq = (a: Coord, b: Coord): boolean => a[0] === b[0] && a[1] === b[1];
export const inBounds = ([x, y]: Coord, [w, h]: Size): boolean =>
  x >= 0 && y >= 0 && x < w && y < h;
export const neighbors = ([x, y]: Coord): Coord[] => [
  [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
];
export const adjacent = (a: Coord, b: Coord): boolean =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
export const allCells = ([w, h]: Size): Coord[] => {
  const cells: Coord[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push([x, y]);
  return cells;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/engine/grid.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/grid.ts src/engine/grid.test.ts
git commit -m "feat(engine): add core types and grid helpers"
```

---

### Task 3: Board validation + win detection

**Files:**
- Create: `src/engine/validate.ts`, `src/engine/validate.test.ts`

`isContiguous` = every consecutive pair adjacent and no repeated cell. `isSolved` = lines match the puzzle's pairs (same colors, endpoints equal unordered), each line contiguous with ≥2 cells, no cell shared between lines, and every board cell covered.

- [ ] **Step 1: Write the failing test**

`src/engine/validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isContiguous, isSolved } from './validate';
import type { Puzzle, Line } from './types';

describe('isContiguous', () => {
  it('true for an adjacent chain', () => {
    expect(isContiguous([[0, 0], [1, 0], [1, 1]])).toBe(true);
  });
  it('false for a jump', () => {
    expect(isContiguous([[0, 0], [2, 0]])).toBe(false);
  });
  it('false for a repeated cell', () => {
    expect(isContiguous([[0, 0], [1, 0], [0, 0]])).toBe(false);
  });
});

describe('isSolved (2x2, 2 colors)', () => {
  const puzzle: Puzzle = {
    id: 't', size: [2, 2], difficulty: 1,
    pairs: [
      { color: 0, a: [0, 0], b: [1, 0] },
      { color: 1, a: [0, 1], b: [1, 1] },
    ],
  };
  it('true when both rows are filled by their color', () => {
    const lines: Line[] = [
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ];
    expect(isSolved(puzzle, lines)).toBe(true);
  });
  it('false when the board is not fully covered', () => {
    const lines: Line[] = [{ color: 0, cells: [[0, 0], [1, 0]] }];
    expect(isSolved(puzzle, lines)).toBe(false);
  });
  it('false when endpoints do not match', () => {
    const lines: Line[] = [
      { color: 0, cells: [[0, 0], [0, 1]] },
      { color: 1, cells: [[1, 0], [1, 1]] },
    ];
    expect(isSolved(puzzle, lines)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/validate.test.ts`
Expected: FAIL — cannot find module `./validate`.

- [ ] **Step 3: Write implementation**

`src/engine/validate.ts`:
```ts
import type { Puzzle, Line, Coord, Pair } from './types';
import { key, eq, adjacent, allCells } from './grid';

export function isContiguous(cells: Coord[]): boolean {
  if (cells.length < 1) return false;
  const seen = new Set<string>();
  for (let i = 0; i < cells.length; i++) {
    const k = key(cells[i]);
    if (seen.has(k)) return false;
    seen.add(k);
    if (i > 0 && !adjacent(cells[i - 1], cells[i])) return false;
  }
  return true;
}

const endpointsMatch = (line: Line, p: Pair): boolean => {
  const first = line.cells[0];
  const last = line.cells[line.cells.length - 1];
  return (eq(first, p.a) && eq(last, p.b)) || (eq(first, p.b) && eq(last, p.a));
};

export function isSolved(puzzle: Puzzle, lines: Line[]): boolean {
  if (lines.length !== puzzle.pairs.length) return false;
  const used = new Set<string>();
  for (const pair of puzzle.pairs) {
    const line = lines.find((l) => l.color === pair.color);
    if (!line) return false;
    if (line.cells.length < 2) return false;
    if (!isContiguous(line.cells)) return false;
    if (!endpointsMatch(line, pair)) return false;
    for (const c of line.cells) {
      const k = key(c);
      if (used.has(k)) return false; // overlap between lines
      used.add(k);
    }
  }
  // full coverage
  return allCells(puzzle.size).every((c) => used.has(key(c)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/engine/validate.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/validate.ts src/engine/validate.test.ts
git commit -m "feat(engine): add path validation and win detection"
```

---

### Task 4: Uniqueness solver

**Files:**
- Create: `src/engine/solver.ts`, `src/engine/solver.test.ts`

`countSolutions` routes each color's path from `a` to `b` through empty cells via backtracking; a full assignment counts as a solution only if every cell is owned. It stops early at `limit` (default 2) — enough to decide uniqueness (`=== 1`).

- [ ] **Step 1: Write the failing test**

`src/engine/solver.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { countSolutions } from './solver';
import type { Puzzle } from './types';

describe('countSolutions', () => {
  it('1x3 single color has exactly one solution', () => {
    const p: Puzzle = { id: 'a', size: [3, 1], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 0] }] };
    expect(countSolutions(p)).toBe(1);
  });
  it('2x2 two colors has exactly one solution', () => {
    const p: Puzzle = {
      id: 'b', size: [2, 2], difficulty: 1,
      pairs: [{ color: 0, a: [0, 0], b: [1, 0] }, { color: 1, a: [0, 1], b: [1, 1] }],
    };
    expect(countSolutions(p)).toBe(1);
  });
  it('3x3 single color across a diagonal is NOT unique (>=2)', () => {
    const p: Puzzle = { id: 'c', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    expect(countSolutions(p)).toBe(2); // capped at limit 2
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/solver.test.ts`
Expected: FAIL — cannot find module `./solver`.

- [ ] **Step 3: Write implementation**

`src/engine/solver.ts`:
```ts
import type { Puzzle, Coord } from './types';
import { key, eq, neighbors, inBounds } from './grid';

export function countSolutions(puzzle: Puzzle, limit = 2): number {
  const { size, pairs } = puzzle;
  const total = size[0] * size[1];
  const owner = new Map<string, number>();
  for (const p of pairs) {
    owner.set(key(p.a), p.color);
    owner.set(key(p.b), p.color);
  }
  let count = 0;

  const extend = (i: number, head: Coord): void => {
    if (count >= limit) return;
    const { b, color } = pairs[i];
    for (const nb of neighbors(head)) {
      if (count >= limit) return;
      if (!inBounds(nb, size)) continue;
      if (eq(nb, b)) {            // reached this color's endpoint -> color done
        routeNext(i + 1);
        continue;                 // other neighbors are alternative branches
      }
      const k = key(nb);
      if (owner.has(k)) continue; // occupied by another cell/endpoint
      owner.set(k, color);
      extend(i, nb);
      owner.delete(k);
    }
  };

  const routeNext = (i: number): void => {
    if (count >= limit) return;
    if (i === pairs.length) {
      if (owner.size === total) count++; // every cell covered
      return;
    }
    extend(i, pairs[i].a);
  };

  routeNext(0);
  return count;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/engine/solver.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/solver.ts src/engine/solver.test.ts
git commit -m "feat(engine): add backtracking uniqueness solver"
```

---

### Task 5: Seeded RNG + full-cover solution generator

**Files:**
- Create: `scripts/generator/rng.ts`, `scripts/generator/generate-solution.ts`, `scripts/generator/generate-solution.test.ts`

`generateSolution` partitions the grid into simple paths via seeded random self-avoiding walks. Each path becomes a color (≥2 cells). If a walk strands a single cell, it returns `null` and the caller retries with another seed. By construction the partition covers every cell.

- [ ] **Step 1: Write the failing test**

`scripts/generator/generate-solution.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mulberry32 } from './rng';
import { generateSolution } from './generate-solution';
import { isContiguous } from '../../src/engine/validate';
import { key, allCells } from '../../src/engine/grid';
import type { Size } from '../../src/engine/types';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    expect(a()).toBeCloseTo(b());
  });
});

describe('generateSolution', () => {
  const size: Size = [5, 5];
  it('produces a full-cover partition of contiguous paths (>=2 cells each)', () => {
    // try several seeds; at least one must yield a valid solution
    let sol = null;
    for (let s = 1; s <= 50 && !sol; s++) sol = generateSolution(size, mulberry32(s));
    expect(sol).not.toBeNull();
    const covered = new Set<string>();
    for (const line of sol!.lines) {
      expect(line.cells.length).toBeGreaterThanOrEqual(2);
      expect(isContiguous(line.cells)).toBe(true);
      for (const c of line.cells) {
        expect(covered.has(key(c))).toBe(false); // no overlap
        covered.add(key(c));
      }
    }
    expect(covered.size).toBe(allCells(size).length); // full cover
    expect(sol!.lines.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/generator/generate-solution.test.ts`
Expected: FAIL — cannot find module `./rng`.

- [ ] **Step 3: Write implementation**

`scripts/generator/rng.ts`:
```ts
// Deterministic PRNG so generation is reproducible and testable.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```
`scripts/generator/generate-solution.ts`:
```ts
import type { Coord, Size, Solution, Line } from '../../src/engine/types';
import { key, neighbors, inBounds, allCells } from '../../src/engine/grid';

export function generateSolution(
  size: Size,
  rng: () => number,
  maxColors = 8,
): Solution | null {
  const total = size[0] * size[1];
  const owner = new Map<string, number>();
  const lines: Line[] = [];
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  let color = 0;

  while (owner.size < total) {
    if (color >= maxColors) return null;
    const free = allCells(size).filter((c) => !owner.has(key(c)));
    const start = pick(free);
    const cells: Coord[] = [start];
    owner.set(key(start), color);
    let head = start;
    while (true) {
      const opts = neighbors(head).filter((c) => inBounds(c, size) && !owner.has(key(c)));
      if (opts.length === 0) break;
      const next = pick(opts);
      cells.push(next);
      owner.set(key(next), color);
      head = next;
      if (cells.length >= 2 && rng() < 0.25) break; // vary path length
    }
    if (cells.length < 2) return null; // stranded single cell -> retry with new seed
    lines.push({ color, cells });
    color++;
  }
  if (lines.length < 2) return null;
  return { lines };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/generator/generate-solution.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/generator/rng.ts scripts/generator/generate-solution.ts scripts/generator/generate-solution.test.ts
git commit -m "feat(generator): seeded RNG and full-cover solution generator"
```

---

### Task 6: Derive puzzle from solution

**Files:**
- Create: `scripts/generator/derive-puzzle.ts`, `scripts/generator/derive-puzzle.test.ts`

Endpoints are the first and last cell of each line. The derived puzzle, when fed to the engine solver, must be solvable; uniqueness is filtered later in the CLI.

- [ ] **Step 1: Write the failing test**

`scripts/generator/derive-puzzle.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { puzzleFromSolution } from './derive-puzzle';
import { isSolved } from '../../src/engine/validate';
import type { Solution } from '../../src/engine/types';

describe('puzzleFromSolution', () => {
  const sol: Solution = {
    lines: [
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ],
  };
  it('takes endpoints from each line ends', () => {
    const p = puzzleFromSolution(sol, [2, 2], 'x', 3);
    expect(p.id).toBe('x');
    expect(p.difficulty).toBe(3);
    expect(p.pairs).toEqual([
      { color: 0, a: [0, 0], b: [1, 0] },
      { color: 1, a: [0, 1], b: [1, 1] },
    ]);
  });
  it('the original solution actually solves the derived puzzle', () => {
    const p = puzzleFromSolution(sol, [2, 2], 'x', 3);
    expect(isSolved(p, sol.lines)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/generator/derive-puzzle.test.ts`
Expected: FAIL — cannot find module `./derive-puzzle`.

- [ ] **Step 3: Write implementation**

`scripts/generator/derive-puzzle.ts`:
```ts
import type { Puzzle, Size, Solution } from '../../src/engine/types';

export function puzzleFromSolution(
  solution: Solution,
  size: Size,
  id: string,
  difficulty: number,
): Puzzle {
  const pairs = solution.lines.map((l) => ({
    color: l.color,
    a: l.cells[0],
    b: l.cells[l.cells.length - 1],
  }));
  return { id, size, difficulty, pairs };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/generator/derive-puzzle.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/generator/derive-puzzle.ts scripts/generator/derive-puzzle.test.ts
git commit -m "feat(generator): derive puzzle endpoints from solution"
```

---

### Task 7: Difficulty scoring

**Files:**
- Create: `scripts/generator/score-difficulty.ts`, `scripts/generator/score-difficulty.test.ts`

Heuristic combines board area, color count, and the ratio of turns (bends) in the solution paths, clamped to 1..10. Monotonic intuition: bigger boards, more colors, and more bends = harder.

- [ ] **Step 1: Write the failing test**

`scripts/generator/score-difficulty.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { scoreDifficulty } from './score-difficulty';
import type { Solution } from '../../src/engine/types';

describe('scoreDifficulty', () => {
  it('returns a value clamped to 1..10', () => {
    const tiny: Solution = { lines: [{ color: 0, cells: [[0, 0], [1, 0]] }] };
    const d = scoreDifficulty(tiny, [2, 1]);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(10);
  });
  it('a large, many-color, twisty board scores higher than a tiny straight one', () => {
    const easy: Solution = { lines: [{ color: 0, cells: [[0, 0], [1, 0], [2, 0]] }] };
    const hard: Solution = {
      lines: [
        { color: 0, cells: [[0, 0], [0, 1], [1, 1], [1, 0]] }, // 2 turns
        { color: 1, cells: [[2, 0], [2, 1], [3, 1], [3, 0]] }, // 2 turns
        { color: 2, cells: [[0, 2], [1, 2]] },
      ],
    };
    expect(scoreDifficulty(hard, [4, 3])).toBeGreaterThan(scoreDifficulty(easy, [3, 1]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/generator/score-difficulty.test.ts`
Expected: FAIL — cannot find module `./score-difficulty`.

- [ ] **Step 3: Write implementation**

`scripts/generator/score-difficulty.ts`:
```ts
import type { Coord, Size, Solution } from '../../src/engine/types';

const dir = (a: Coord, b: Coord): string => `${b[0] - a[0]},${b[1] - a[1]}`;

export function scoreDifficulty(solution: Solution, size: Size): number {
  const area = size[0] * size[1];
  const colors = solution.lines.length;
  let turns = 0;
  let length = 0;
  for (const line of solution.lines) {
    length += line.cells.length;
    for (let i = 1; i < line.cells.length - 1; i++) {
      if (dir(line.cells[i - 1], line.cells[i]) !== dir(line.cells[i], line.cells[i + 1])) turns++;
    }
  }
  const turnRatio = turns / Math.max(1, length);
  const raw = area * 0.15 + colors * 0.6 + turnRatio * 10;
  return Math.max(1, Math.min(10, Math.round(raw)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/generator/score-difficulty.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/generator/score-difficulty.ts scripts/generator/score-difficulty.test.ts
git commit -m "feat(generator): heuristic difficulty scoring"
```

---

### Task 8: Packaging (buckets + daily schedule) and CLI

**Files:**
- Create: `scripts/generator/package.ts`, `scripts/generator/package.test.ts`, `scripts/generator/cli.ts`

`bucketByDifficulty` groups puzzles by their `difficulty`. `buildDailySchedule` assigns one puzzle per calendar day with an NYT-style weekly ramp (Mon easiest → Sun harder), cycling through each day's target bucket. The CLI ties everything together: generate → derive → verify uniqueness → score → dedupe → bucket → write JSON.

- [ ] **Step 1: Write the failing test**

`scripts/generator/package.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/generator/package.test.ts`
Expected: FAIL — cannot find module `./package`.

- [ ] **Step 3: Write implementation**

`scripts/generator/package.ts`:
```ts
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
```
`scripts/generator/cli.ts`:
```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { mulberry32 } from './rng';
import { generateSolution } from './generate-solution';
import { puzzleFromSolution } from './derive-puzzle';
import { scoreDifficulty } from './score-difficulty';
import { bucketByDifficulty, buildDailySchedule } from './package';
import { countSolutions } from '../../src/engine/solver';
import type { Puzzle, Size } from '../../src/engine/types';

const SIZES: Size[] = [[5, 5], [6, 6], [7, 7], [8, 8]];
const TARGET = Number(process.env.COUNT ?? 500);   // total unique puzzles to emit
const OUT = resolve(process.cwd(), 'public/levels');

function run(): void {
  const puzzles: Puzzle[] = [];
  const seen = new Set<string>();
  let seed = 1;
  let attempts = 0;
  while (puzzles.length < TARGET && attempts < TARGET * 200) {
    attempts++;
    const size = SIZES[seed % SIZES.length];
    const sol = generateSolution(size, mulberry32(seed++));
    if (!sol) continue;
    const draft = puzzleFromSolution(sol, size, 'tmp', 0);
    if (countSolutions(draft, 2) !== 1) continue;   // keep only uniquely-solvable
    const difficulty = scoreDifficulty(sol, size);
    const id = `s${size[0]}-${puzzles.length.toString().padStart(5, '0')}`;
    const sig = JSON.stringify(draft.pairs);
    if (seen.has(sig)) continue;
    seen.add(sig);
    puzzles.push({ ...draft, id, difficulty });
  }

  const byBucket = bucketByDifficulty(puzzles);
  const schedule = buildDailySchedule(byBucket, '2026-06-01', 400);

  mkdirSync(OUT, { recursive: true });
  for (const [bucket, list] of Object.entries(byBucket)) {
    writeFileSync(resolve(OUT, `bucket-${bucket}.json`), JSON.stringify(list));
  }
  writeFileSync(resolve(OUT, 'daily-schedule.json'), JSON.stringify(schedule));
  writeFileSync(
    resolve(OUT, 'manifest.json'),
    JSON.stringify({ total: puzzles.length, buckets: Object.keys(byBucket).map(Number).sort((a, b) => a - b), generatedAttempts: attempts }),
  );
  console.log(`Generated ${puzzles.length} puzzles across buckets ${Object.keys(byBucket).sort().join(', ')}; schedule=${schedule.length} days.`);
}

run();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/generator/package.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + the generator end-to-end**

Run: `pnpm test`
Expected: ALL test files PASS.
Run: `COUNT=200 pnpm gen`
Expected: console prints "Generated 200 puzzles ..." and `public/levels/` contains `bucket-*.json`, `daily-schedule.json`, `manifest.json`. Open `manifest.json` and confirm `total` is 200 and `buckets` is non-empty.

- [ ] **Step 6: Commit**

```bash
git add scripts/generator/package.ts scripts/generator/package.test.ts scripts/generator/cli.ts public/levels
git commit -m "feat(generator): bucketing, daily schedule, and level-pack CLI"
```

---

## Self-review (against spec §4)

- **Pre-generate offline → static JSON:** Task 8 CLI writes `public/levels/*.json`. ✓
- **Full board fill:** `generateSolution` partitions all cells; `isSolved` and `countSolutions` both require full coverage. ✓
- **Unique solution verify:** Task 8 keeps only `countSolutions(draft, 2) === 1`. ✓
- **Difficulty scoring + buckets:** Tasks 7 & 8. ✓
- **Daily schedule with weekly ramp:** `buildDailySchedule` + `WEEKDAY_BUCKET`. ✓
- **Rules engine for app/hint (validate, solver):** Tasks 3 & 4 (shared `src/engine`, reused by app in Phase 1). ✓
- **Type consistency:** `Coord/Size/Pair/Puzzle/Line/Solution` defined once in `types.ts`; `Line.cells` used everywhere (not `path`); function names match the locked signatures. ✓
- **Known gap (acceptable for Phase 0):** the solver has no advanced pruning, so very large/dense boards could be slow; mitigated by capping sizes at 8×8 and running offline. Note in spec §9 already flags generation cost. Performance hardening deferred until generation volume demands it.

> Note: `public/levels` is committed so Phase 1 can read packs without re-running the generator. For large volumes, re-run `COUNT=20000 pnpm gen` later.
