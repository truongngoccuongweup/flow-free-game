import { describe, it, expect } from 'vitest';
import { createPlayState, linesFromState, isWon } from './play-state';
import type { Puzzle } from '../engine/types';

const puzzle2x2: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('createPlayState', () => {
  it('starts with an empty path per color and no active color', () => {
    const s = createPlayState(puzzle2x2);
    expect(s.active).toBeNull();
    expect(s.paths).toEqual({ 0: [], 1: [] });
  });
});

describe('linesFromState + isWon', () => {
  it('a fresh state is not won', () => {
    expect(isWon(puzzle2x2, createPlayState(puzzle2x2))).toBe(false);
  });
  it('a fully and correctly filled state is won', () => {
    const s = createPlayState(puzzle2x2);
    s.paths[0] = [[0, 0], [1, 0]];
    s.paths[1] = [[0, 1], [1, 1]];
    expect(linesFromState(s)).toEqual([
      { color: 0, cells: [[0, 0], [1, 0]] },
      { color: 1, cells: [[0, 1], [1, 1]] },
    ]);
    expect(isWon(puzzle2x2, s)).toBe(true);
  });
});
