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
});
