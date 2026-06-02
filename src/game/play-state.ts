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
