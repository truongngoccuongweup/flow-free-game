'use client';
import { useCallback, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Puzzle, Coord } from '../engine/types';
import { createPlayState, beginAt, extendTo, endDrag, isWon, type PlayState } from '../game/play-state';
import { pointToCell, stepsToward } from './geometry';

const U = 100;

export function useFlowBoard(puzzle: Puzzle, initial?: PlayState) {
  const [state, setState] = useState<PlayState>(() => initial ?? createPlayState(puzzle));
  const history = useRef<PlayState[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const cellFromEvent = useCallback(
    (e: PointerEvent<SVGSVGElement>): Coord | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const localX = ((e.clientX - rect.left) / rect.width) * puzzle.size[0] * U;
      const localY = ((e.clientY - rect.top) / rect.height) * puzzle.size[1] * U;
      return pointToCell(localX, localY, U, puzzle.size);
    },
    [puzzle],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const cell = cellFromEvent(e);
      if (!cell) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      history.current.push(state);
      setState((s) => beginAt(s, puzzle, cell));
    },
    [cellFromEvent, puzzle, state],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      setState((s) => {
        if (s.active === null) return s;
        const cell = cellFromEvent(e);
        if (!cell) return s;
        const path = s.paths[s.active];
        const head = path[path.length - 1];
        let next = s;
        for (const step of stepsToward(head, cell)) next = extendTo(next, puzzle, step);
        return next;
      });
    },
    [cellFromEvent, puzzle],
  );

  const onPointerUp = useCallback(() => setState((s) => endDrag(s)), []);
  const reset = useCallback(() => {
    history.current = [];
    setState(createPlayState(puzzle));
  }, [puzzle]);
  const undo = useCallback(() => setState((s) => history.current.pop() ?? s), []);

  return { state, svgRef, onPointerDown, onPointerMove, onPointerUp, reset, undo, won: isWon(puzzle, state) };
}
