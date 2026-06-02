// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { EndlessGame } from './EndlessGame';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

afterEach(cleanup);

const puzzle: Puzzle = {
  id: 't1', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('EndlessGame', () => {
  it('renders the board and controls', () => {
    const { getByTestId, getByText } = render(<EndlessGame puzzles={[puzzle]} />);
    expect(getByTestId('board')).toBeTruthy();
    expect(getByText('Hoàn tác')).toBeTruthy();
    expect(getByText('Làm lại')).toBeTruthy();
  });
  it('shows a win overlay when seeded with a solved state', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { getByRole } = render(<EndlessGame puzzles={[puzzle]} initialState={solved} />);
    expect(getByRole('dialog')).toBeTruthy();
  });
  it('advancing past the last puzzle shows an end message', () => {
    const solved = createPlayState(puzzle);
    solved.paths[0] = [[0, 0], [1, 0]];
    solved.paths[1] = [[0, 1], [1, 1]];
    const { getByText } = render(<EndlessGame puzzles={[puzzle]} initialState={solved} />);
    fireEvent.click(getByText(/Màn tiếp/));
    expect(getByText('Hết màn — quay lại sau nhé!')).toBeTruthy();
  });
});
