import { describe, it, expect } from 'vitest';
import { pointToCell, stepsToward } from './geometry';

describe('pointToCell', () => {
  it('maps a point to its cell', () => {
    expect(pointToCell(10, 10, 50, [3, 3])).toEqual([0, 0]);
    expect(pointToCell(120, 60, 50, [3, 3])).toEqual([2, 1]);
  });
  it('returns null outside the grid', () => {
    expect(pointToCell(160, 10, 50, [3, 3])).toBeNull(); // col 3 out of bounds
    expect(pointToCell(-1, 10, 50, [3, 3])).toBeNull();
  });
  it('returns null for non-positive cell size', () => {
    expect(pointToCell(10, 10, 0, [3, 3])).toBeNull();
  });
});

describe('stepsToward', () => {
  it('walks X then Y in single steps', () => {
    expect(stepsToward([0, 0], [2, 1])).toEqual([[1, 0], [2, 0], [2, 1]]);
  });
  it('handles same cell', () => {
    expect(stepsToward([1, 1], [1, 1])).toEqual([]);
  });
  it('handles negative direction', () => {
    expect(stepsToward([2, 2], [1, 2])).toEqual([[1, 2]]);
  });
});
