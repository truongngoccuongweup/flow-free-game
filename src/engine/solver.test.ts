import { describe, it, expect } from 'vitest';
import { countSolutions } from './solver';
import type { Puzzle } from './types';

describe('countSolutions', () => {
  it('1x3 single color has exactly one solution', () => {
    const p: Puzzle = { id: 'a', size: [3, 1], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 0] }] };
    expect(countSolutions(p)).toBe(1);
  });
  it('2x2 two colors has exactly one solution', () => {
    const p: Puzzle = {
      id: 'b', size: [2, 2], difficulty: 1,
      pairs: [{ color: 0, a: [0, 0], b: [1, 0] }, { color: 1, a: [0, 1], b: [1, 1] }],
    };
    expect(countSolutions(p)).toBe(1);
  });
  it('3x3 single color across a diagonal is NOT unique (>=2)', () => {
    const p: Puzzle = { id: 'c', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    expect(countSolutions(p)).toBe(2); // capped at limit 2
  });
});
