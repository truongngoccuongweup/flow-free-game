'use client';
import { useEffect, useRef, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { countCompletedColors, type PlayState } from '../game/play-state';
import { sfx, vibrate } from './feedback';
import { useFeedbackPrefs, prefersReducedMotion } from './useFeedbackPrefs';

const filledCount = (state: PlayState): number =>
  Object.values(state.paths).reduce((sum, cells) => sum + cells.length, 0);

/** Fires sound + haptics on connect / color-complete / win, and signals a confetti burst on win. */
export function useBoardFeedback(puzzle: Puzzle, state: PlayState, won: boolean) {
  const { enabled } = useFeedbackPrefs();
  const filledRef = useRef(0);
  const completeRef = useRef(0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const filled = filledCount(state);
    const complete = countCompletedColors(puzzle, state);
    if (enabled && !won) {
      if (complete > completeRef.current) { sfx.complete(); vibrate(14); }
      else if (filled > filledRef.current) { sfx.connect(); vibrate(6); }
    }
    filledRef.current = filled;
    completeRef.current = complete;
  }, [state, puzzle, enabled, won]);

  useEffect(() => {
    if (!won) { setConfetti(false); return; }
    if (enabled) { sfx.win(); vibrate([0, 30, 40, 30]); }
    if (!prefersReducedMotion()) setConfetti(true);
  }, [won, enabled]);

  return { confetti };
}
