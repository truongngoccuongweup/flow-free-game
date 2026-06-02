import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadEndlessPuzzles } from './level-loader';
import type { Puzzle } from '../engine/types';

const mk = (id: string, difficulty: number): Puzzle => ({ id, size: [5, 5], difficulty, pairs: [] });

afterEach(() => vi.unstubAllGlobals());

describe('loadEndlessPuzzles', () => {
  it('fetches manifest + buckets and returns difficulty-ordered puzzles', async () => {
    const responses: Record<string, unknown> = {
      '/levels/manifest.json': { total: 3, buckets: [5, 6] },
      '/levels/bucket-5.json': [mk('b', 5), mk('a', 5)],
      '/levels/bucket-6.json': [mk('c', 6)],
    };
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({ json: () => Promise.resolve(responses[url]) })));
    const out = await loadEndlessPuzzles();
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c']); // diff 5 (a,b) then 6 (c)
  });
});
