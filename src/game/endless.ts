import type { Puzzle } from '../engine/types';
import { endlessOrder } from './level-repository';

/**
 * Order puzzles so difficulty RAMPS as the player advances:
 *  - Phase A (ramp): take `perStep` puzzles from each difficulty ascending → e.g. 2,2,3,3,4,4,5,5,6,6,7,7
 *  - Phase B (sustain): round-robin from hardest down so harder puzzles stay frequent and varied.
 * Every puzzle appears exactly once.
 */
export function buildEndlessSequence(puzzles: Puzzle[], perStep = 2): Puzzle[] {
  const byDiff = new Map<number, Puzzle[]>();
  for (const p of endlessOrder(puzzles)) {
    const arr = byDiff.get(p.difficulty);
    if (arr) arr.push(p);
    else byDiff.set(p.difficulty, [p]);
  }
  const diffsAsc = [...byDiff.keys()].sort((a, b) => a - b);
  const out: Puzzle[] = [];

  for (const d of diffsAsc) {
    const q = byDiff.get(d)!;
    for (let i = 0; i < perStep && q.length; i++) out.push(q.shift()!);
  }

  const diffsDesc = [...diffsAsc].reverse();
  let added = true;
  while (added) {
    added = false;
    for (const d of diffsDesc) {
      const q = byDiff.get(d)!;
      if (q.length) { out.push(q.shift()!); added = true; }
    }
  }
  return out;
}
