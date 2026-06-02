import { describe, it, expect } from 'vitest';
import { createPlayState, linesFromState, isWon, beginAt } from './play-state';
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

describe('beginAt', () => {
  it('grabbing an endpoint starts that color fresh', () => {
    const s = beginAt(createPlayState(puzzle2x2), puzzle2x2, [0, 0]);
    expect(s.active).toBe(0);
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('grabbing a drawn cell truncates that color to it and reactivates', () => {
    let s = createPlayState(puzzle2x2);
    s.paths[0] = [[0, 0], [1, 0]];
    s = beginAt(s, puzzle2x2, [0, 0]); // grab the start endpoint
    expect(s.active).toBe(0);
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('grabbing an empty non-endpoint cell deactivates', () => {
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    const s = beginAt(createPlayState(p3), p3, [1, 1]);
    expect(s.active).toBeNull();
  });
  it('does not mutate the input state', () => {
    const before = createPlayState(puzzle2x2);
    beginAt(before, puzzle2x2, [0, 0]);
    expect(before.paths[0]).toEqual([]);
    expect(before.active).toBeNull();
  });
});
