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
