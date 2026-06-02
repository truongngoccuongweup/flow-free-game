import { describe, it, expect } from 'vitest';
import { puzzleFromSolution } from './derive-puzzle';
import { isSolved } from '../../src/engine/validate';
import type { Solution } from '../../src/engine/types';

describe('puzzleFromSolution', () => {
  const sol: Solution = {
    lines: [
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ],
  };
  it('takes endpoints from each line ends', () => {
    const p = puzzleFromSolution(sol, [2, 2], 'x', 3);
    expect(p.id).toBe('x');
    expect(p.difficulty).toBe(3);
    expect(p.pairs).toEqual([
      { color: 0, a: [0, 0], b: [1, 0] },
      { color: 1, a: [0, 1], b: [1, 1] },
    ]);
  });
  it('the original solution actually solves the derived puzzle', () => {
    const p = puzzleFromSolution(sol, [2, 2], 'x', 3);
    expect(isSolved(p, sol.lines)).toBe(true);
  });
});
