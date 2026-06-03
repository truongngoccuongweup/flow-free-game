import { describe, it, expect } from 'vitest';
import { buildEndlessSequence } from './endless';
import type { Puzzle } from '../engine/types';

const mk = (id: string, difficulty: number): Puzzle => ({ id, size: [5, 5], difficulty, pairs: [] });

describe('buildEndlessSequence', () => {
  const puzzles = [
    ...Array.from({ length: 5 }, (_, i) => mk(`a${i}`, 2)),
    ...Array.from({ length: 5 }, (_, i) => mk(`b${i}`, 3)),
    ...Array.from({ length: 5 }, (_, i) => mk(`c${i}`, 5)),
  ];

  it('keeps every puzzle exactly once', () => {
    const seq = buildEndlessSequence(puzzles, 2);
    expect(seq.length).toBe(15);
    expect(new Set(seq.map((p) => p.id)).size).toBe(15);
  });

  it('ramps difficulty at the start (perStep from each, ascending)', () => {
    const seq = buildEndlessSequence(puzzles, 2);
    expect(seq[0].difficulty).toBe(2); // starts easy
    expect(seq.slice(0, 6).map((p) => p.difficulty)).toEqual([2, 2, 3, 3, 5, 5]);
  });

  it('later puzzles are harder than the first', () => {
    const seq = buildEndlessSequence(puzzles, 2);
    expect(seq[4].difficulty).toBeGreaterThan(seq[0].difficulty);
  });
});
