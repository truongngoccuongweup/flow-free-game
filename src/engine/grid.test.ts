import { describe, it, expect } from 'vitest';
import { key, eq, inBounds, neighbors, adjacent, allCells } from './grid';

describe('grid helpers', () => {
  it('key + eq', () => {
    expect(key([2, 3])).toBe('2,3');
    expect(eq([1, 1], [1, 1])).toBe(true);
    expect(eq([1, 1], [1, 2])).toBe(false);
  });
  it('inBounds', () => {
    expect(inBounds([0, 0], [3, 3])).toBe(true);
    expect(inBounds([3, 0], [3, 3])).toBe(false);
    expect(inBounds([-1, 0], [3, 3])).toBe(false);
  });
  it('neighbors are the 4 orthogonal cells', () => {
    expect(neighbors([1, 1]).sort()).toEqual([[0, 1], [1, 0], [1, 2], [2, 1]].sort());
  });
  it('adjacent', () => {
    expect(adjacent([1, 1], [1, 2])).toBe(true);
    expect(adjacent([1, 1], [2, 2])).toBe(false);
  });
  it('allCells lists every cell row-major', () => {
    expect(allCells([2, 2])).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
  });
});
