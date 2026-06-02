import type { Puzzle, Coord, Solution, Pair } from '../engine/types';
import { eq, key } from '../engine/grid';
import { isContiguous } from '../engine/validate';
import type { PlayState } from './play-state';

function complete(cells: Coord[] | undefined, pair: Pair): boolean {
  if (!cells || cells.length < 2 || !isContiguous(cells)) return false;
  const f = cells[0];
  const l = cells[cells.length - 1];
  return (eq(f, pair.a) && eq(l, pair.b)) || (eq(f, pair.b) && eq(l, pair.a));
}

/**
 * Reveal the correct path for the first not-yet-completed color, clearing any
 * other color's cells that collide with it. Returns null if everything is done.
 */
export function applyHint(puzzle: Puzzle, state: PlayState, solution: Solution): PlayState | null {
  const solByColor = new Map(solution.lines.map((l) => [l.color, l.cells]));
  for (const pair of puzzle.pairs) {
    if (complete(state.paths[pair.color], pair)) continue;
    const sol = solByColor.get(pair.color);
    if (!sol) continue;
    const solSet = new Set(sol.map(key));
    const paths: Record<number, Coord[]> = {};
    for (const c of Object.keys(state.paths)) {
      const ci = Number(c);
      paths[ci] = ci === pair.color ? [...sol] : state.paths[ci].filter((cell) => !solSet.has(key(cell)));
    }
    return { active: null, paths };
  }
  return null;
}
