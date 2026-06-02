import { describe, it, expect } from 'vitest';
import { createPlayState, linesFromState, isWon, beginAt, extendTo } from './play-state';
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

describe('extendTo (extend / backtrack / block)', () => {
  const start = () => beginAt(createPlayState(puzzle2x2), puzzle2x2, [0, 0]);
  it('extends to an adjacent free cell', () => {
    const s = extendTo(start(), puzzle2x2, [1, 0]); // [1,0] is color 0's other endpoint -> allowed
    expect(s.paths[0]).toEqual([[0, 0], [1, 0]]);
  });
  it('ignores a non-adjacent cell', () => {
    const s = extendTo(start(), puzzle2x2, [1, 1]); // diagonal from [0,0]
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('backtracks when moving onto the previous cell', () => {
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    let t = beginAt(createPlayState(p3), p3, [0, 0]);
    t = extendTo(t, p3, [1, 0]); // [[0,0],[1,0]]
    t = extendTo(t, p3, [0, 0]); // back onto previous -> drop head
    expect(t.paths[0]).toEqual([[0, 0]]);
  });
  it("blocks stepping onto another color's endpoint", () => {
    const s = extendTo(start(), puzzle2x2, [0, 1]); // [0,1] is color 1's endpoint
    expect(s.paths[0]).toEqual([[0, 0]]);
  });
  it('blocks self-crossing', () => {
    const p3: Puzzle = { id: 'p3', size: [3, 3], difficulty: 1, pairs: [{ color: 0, a: [0, 0], b: [2, 2] }] };
    let t = beginAt(createPlayState(p3), p3, [0, 0]);
    t = extendTo(t, p3, [1, 0]);
    t = extendTo(t, p3, [1, 1]);
    t = extendTo(t, p3, [0, 1]);
    t = extendTo(t, p3, [0, 0]); // [0,0] already on path -> block
    expect(t.paths[0]).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
  });
});
