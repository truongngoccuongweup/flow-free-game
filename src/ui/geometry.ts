import type { Coord, Size } from '../engine/types';

export function pointToCell(localX: number, localY: number, cellPx: number, size: Size): Coord | null {
  if (cellPx <= 0) return null;
  const col = Math.floor(localX / cellPx);
  const row = Math.floor(localY / cellPx);
  if (col < 0 || row < 0 || col >= size[0] || row >= size[1]) return null;
  return [col, row];
}

export function stepsToward(head: Coord, target: Coord): Coord[] {
  const steps: Coord[] = [];
  let x = head[0];
  let y = head[1];
  while (x !== target[0]) { x += target[0] > x ? 1 : -1; steps.push([x, y]); }
  while (y !== target[1]) { y += target[1] > y ? 1 : -1; steps.push([x, y]); }
  return steps;
}
