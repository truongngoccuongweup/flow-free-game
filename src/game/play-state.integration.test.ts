import { describe, it, expect } from 'vitest';
import { createPlayState, beginAt, extendTo, endDrag, isWon } from './play-state';
import type { Puzzle } from '../engine/types';

// 3x3, two colors, full-fill solution covering all 9 cells:
//   color 0 (snake): [0,0],[0,1],[0,2],[1,2],[1,1],[1,0],[2,0]   endpoints [0,0],[2,0]
//   color 1:         [2,1],[2,2]                                  endpoints [2,1],[2,2]
const puzzle: Puzzle = {
  id: 'i3', size: [3, 3], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [2, 0] },
    { color: 1, a: [2, 1], b: [2, 2] },
  ],
};

describe('solving a board through drag operations', () => {
  it('reaches isWon by dragging both colors to completion', () => {
    let s = createPlayState(puzzle);
    expect(isWon(puzzle, s)).toBe(false);

    s = beginAt(s, puzzle, [0, 0]);
    for (const c of [[0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0]] as [number, number][]) {
      s = extendTo(s, puzzle, c);
    }
    s = endDrag(s);
    expect(s.paths[0]).toEqual([[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0]]);
    expect(isWon(puzzle, s)).toBe(false); // color 1 not yet drawn

    s = beginAt(s, puzzle, [2, 1]);
    s = extendTo(s, puzzle, [2, 2]);
    s = endDrag(s);

    expect(isWon(puzzle, s)).toBe(true);
  });
});
