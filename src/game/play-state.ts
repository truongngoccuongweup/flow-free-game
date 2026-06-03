import type { Puzzle, Coord, Line } from '../engine/types';
import { eq, adjacent, key } from '../engine/grid';
import { isSolved, isContiguous } from '../engine/validate';

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

export interface BoardProgress {
  filled: number;     // unique cells covered by any path
  total: number;      // all cells on the board
  pairsDone: number;  // colors fully connected
  pairsTotal: number; // total colors
}

/** How close the board is to a win: cells filled + pairs connected. */
export function boardProgress(puzzle: Puzzle, state: PlayState): BoardProgress {
  const seen = new Set<string>();
  for (const cells of Object.values(state.paths)) for (const c of cells) seen.add(key(c));
  return {
    filled: seen.size,
    total: puzzle.size[0] * puzzle.size[1],
    pairsDone: countCompletedColors(puzzle, state),
    pairsTotal: puzzle.pairs.length,
  };
}

/** Number of colors whose path correctly connects both endpoints (contiguous, ≥2 cells). */
export function countCompletedColors(puzzle: Puzzle, state: PlayState): number {
  let n = 0;
  for (const pair of puzzle.pairs) {
    const cells = state.paths[pair.color];
    if (!cells || cells.length < 2 || !isContiguous(cells)) continue;
    const first = cells[0];
    const last = cells[cells.length - 1];
    if ((eq(first, pair.a) && eq(last, pair.b)) || (eq(first, pair.b) && eq(last, pair.a))) n++;
  }
  return n;
}

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
