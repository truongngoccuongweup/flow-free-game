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
