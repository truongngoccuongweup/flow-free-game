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
