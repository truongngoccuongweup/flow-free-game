import { describe, it, expect } from 'vitest';
import { scoreDifficulty } from './score-difficulty';
import type { Solution } from '../../src/engine/types';

describe('scoreDifficulty', () => {
  it('returns a value clamped to 1..10', () => {
    const tiny: Solution = { lines: [{ color: 0, cells: [[0, 0], [1, 0]] }] };
    const d = scoreDifficulty(tiny, [2, 1]);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(10);
  });
  it('a large, many-color, twisty board scores higher than a tiny straight one', () => {
    const easy: Solution = { lines: [{ color: 0, cells: [[0, 0], [1, 0], [2, 0]] }] };
    const hard: Solution = {
      lines: [
        { color: 0, cells: [[0, 0], [0, 1], [1, 1], [1, 0]] }, // 2 turns
        { color: 1, cells: [[2, 0], [2, 1], [3, 1], [3, 0]] }, // 2 turns
        { color: 2, cells: [[0, 2], [1, 2]] },
      ],
    };
    expect(scoreDifficulty(hard, [4, 3])).toBeGreaterThan(scoreDifficulty(easy, [3, 1]));
  });
  it('small grids land in the easy buckets, big grids in the hard end', () => {
    const small: Solution = { lines: [{ color: 0, cells: [[0, 0], [1, 0], [2, 0]] }, { color: 1, cells: [[0, 1], [1, 1], [2, 1]] }, { color: 2, cells: [[0, 2], [1, 2], [2, 2]] }] };
    const big: Solution = { lines: Array.from({ length: 8 }, (_, k) => ({ color: k, cells: [[0, k], [1, k], [2, k], [3, k], [4, k], [5, k], [6, k], [7, k]] as [number, number][] })) };
    const sEasy = scoreDifficulty(small, [3, 3]);
    const sHard = scoreDifficulty(big, [8, 8]);
    expect(sEasy).toBeLessThanOrEqual(4);   // 3x3 is genuinely easy
    expect(sHard).toBeGreaterThanOrEqual(8); // 8x8 is genuinely hard
  });
});
