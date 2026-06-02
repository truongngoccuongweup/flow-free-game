import { describe, it, expect } from 'vitest';
import { applyHint } from './hint';
import { createPlayState, isWon } from './play-state';
import { solve } from '../engine/solver';
import type { Puzzle } from '../engine/types';

const puzzle: Puzzle = {
  id: 'h', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('applyHint', () => {
  it('fills one incomplete color with its correct path', () => {
    const sol = solve(puzzle)!;
    const s0 = createPlayState(puzzle);
    const s1 = applyHint(puzzle, s0, sol)!;
    expect(s1.paths[0].length).toBeGreaterThanOrEqual(2); // color 0 now drawn
  });
  it('two hints complete the board (isWon)', () => {
    const sol = solve(puzzle)!;
    let s = createPlayState(puzzle);
    s = applyHint(puzzle, s, sol)!;
    s = applyHint(puzzle, s, sol)!;
    expect(isWon(puzzle, s)).toBe(true);
  });
  it('returns null when nothing is left to hint', () => {
    const sol = solve(puzzle)!;
    let s = createPlayState(puzzle);
    s = applyHint(puzzle, s, sol)!;
    s = applyHint(puzzle, s, sol)!;
    expect(applyHint(puzzle, s, sol)).toBeNull();
  });
});
