// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowBoard } from './useFlowBoard';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

const puzzle: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('useFlowBoard', () => {
  it('starts not won', () => {
    const { result } = renderHook(() => useFlowBoard(puzzle));
    expect(result.current.won).toBe(false);
  });
  it('reports won when seeded with a solved state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { result } = renderHook(() => useFlowBoard(puzzle, solved));
    expect(result.current.won).toBe(true);
  });
  it('reset returns to an empty, not-won state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { result } = renderHook(() => useFlowBoard(puzzle, solved));
    act(() => result.current.reset());
    expect(result.current.won).toBe(false);
    expect(result.current.state.paths[0]).toEqual([]);
  });
});
