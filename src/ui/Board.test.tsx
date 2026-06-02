// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Board } from './Board';
import type { Puzzle } from '../engine/types';
import { createPlayState } from '../game/play-state';

afterEach(cleanup);

const puzzle: Puzzle = {
  id: 't', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 1, a: [0, 1], b: [1, 1] },
  ],
};

describe('Board', () => {
  it('renders an svg with one endpoint circle per endpoint (4)', () => {
    const { getByTestId } = render(<Board puzzle={puzzle} state={createPlayState(puzzle)} />);
    const svg = getByTestId('board');
    expect(svg.querySelectorAll('[data-ep]').length).toBe(4);
  });
  it('renders a path element when a color has a drawn line', () => {
    const state = createPlayState(puzzle);
    state.paths[0] = [[0, 0], [1, 0]];
    const { getByTestId } = render(<Board puzzle={puzzle} state={state} />);
    expect(getByTestId('board').querySelectorAll('path').length).toBe(1);
  });
});
