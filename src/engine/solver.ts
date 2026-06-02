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
