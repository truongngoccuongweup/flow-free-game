'use client';
import { useState } from 'react';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';
import { useBoardFeedback } from './useBoardFeedback';
import { Confetti } from './Confetti';

function BoardGame({ puzzle, initialState, onNext }: { puzzle: Puzzle; initialState?: PlayState; onNext: () => void }) {
  const b = useFlowBoard(puzzle, initialState);
  const { confetti } = useBoardFeedback(puzzle, b.state, b.won);
  return (
    <>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board
            puzzle={puzzle}
            state={b.state}
            svgRef={b.svgRef}
            onPointerDown={b.onPointerDown}
            onPointerMove={b.onPointerMove}
            onPointerUp={b.onPointerUp}
          />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Undo</button>
        <button className="df-btn" onClick={b.reset}>Reset</button>
      </div>
      {confetti && <Confetti />}
      {b.won && (
        <div className="df-win" role="dialog" aria-label="Hoàn thành">
          <div className="df-win-card">
            <p className="df-title" style={{ fontSize: 24, margin: '0 0 12px' }}>Hoàn thành! 🎉</p>
            <button className="df-btn df-cta" onClick={onNext}>Màn tiếp</button>
          </div>
        </div>
      )}
    </>
  );
}

export function EndlessGame({ puzzles, initialState }: { puzzles: Puzzle[]; initialState?: PlayState }) {
  const [index, setIndex] = useState(0);
  const puzzle = puzzles[index];
  if (!puzzle) {
    return (
      <div className="df-board-wrap">
        <p className="df-title">Hết màn — quay lại sau nhé!</p>
      </div>
    );
  }
  return (
    <BoardGame
      key={puzzle.id}
      puzzle={puzzle}
      initialState={index === 0 ? initialState : undefined}
      onNext={() => setIndex((i) => i + 1)}
    />
  );
}
