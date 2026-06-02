import { describe, it, expect } from 'vitest';
import { isContiguous, isSolved } from './validate';
import type { Puzzle, Line } from './types';

describe('isContiguous', () => {
  it('true for an adjacent chain', () => {
    expect(isContiguous([[0, 0], [1, 0], [1, 1]])).toBe(true);
  });
  it('false for a jump', () => {
    expect(isContiguous([[0, 0], [2, 0]])).toBe(false);
  });
  it('false for a repeated cell', () => {
    expect(isContiguous([[0, 0], [1, 0], [0, 0]])).toBe(false);
  });
});

describe('isSolved (2x2, 2 colors)', () => {
  const puzzle: Puzzle = {
    id: 't', size: [2, 2], difficulty: 1,
    pairs: [
      { color: 0, a: [0, 0], b: [1, 0] },
      { color: 1, a: [0, 1], b: [1, 1] },
    ],
  };
  it('true when both rows are filled by their color', () => {
    const lines: Line[] = [
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ];
    expect(isSolved(puzzle, lines)).toBe(true);
  });
  it('false when the board is not fully covered', () => {
    const lines: Line[] = [{ color: 0, cells: [[0, 0], [1, 0]] }];
    expect(isSolved(puzzle, lines)).toBe(false);
  });
  it('false when endpoints do not match', () => {
    const lines: Line[] = [
      { color: 0, cells: [[0, 0], [0, 1]] },
      { color: 1, cells: [[1, 0], [1, 1]] },
    ];
    expect(isSolved(puzzle, lines)).toBe(false);
  });
});
