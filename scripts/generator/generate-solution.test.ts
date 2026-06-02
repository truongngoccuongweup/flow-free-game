import { describe, it, expect } from 'vitest';
import { mulberry32 } from './rng';
import { generateSolution } from './generate-solution';
import { isContiguous } from '../../src/engine/validate';
import { key, allCells } from '../../src/engine/grid';
import type { Size } from '../../src/engine/types';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    expect(a()).toBeCloseTo(b());
  });
});

describe('generateSolution', () => {
  const size: Size = [5, 5];
  it('produces a full-cover partition of contiguous paths (>=2 cells each)', () => {
    // try several seeds; at least one must yield a valid solution
    let sol = null;
    for (let s = 1; s <= 50 && !sol; s++) sol = generateSolution(size, mulberry32(s));
    expect(sol).not.toBeNull();
    const covered = new Set<string>();
    for (const line of sol!.lines) {
      expect(line.cells.length).toBeGreaterThanOrEqual(2);
      expect(isContiguous(line.cells)).toBe(true);
      for (const c of line.cells) {
        expect(covered.has(key(c))).toBe(false); // no overlap
        covered.add(key(c));
      }
    }
    expect(covered.size).toBe(allCells(size).length); // full cover
    expect(sol!.lines.length).toBeGreaterThanOrEqual(2);
  });
});
