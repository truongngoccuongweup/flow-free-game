import type { Puzzle, Line, Coord, Pair } from './types';
import { key, eq, adjacent, allCells } from './grid';

export function isContiguous(cells: Coord[]): boolean {
  if (cells.length < 2) return false;
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
