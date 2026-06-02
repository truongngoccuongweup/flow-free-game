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
