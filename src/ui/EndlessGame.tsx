'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';
import { Board } from './Board';
import { BoardProgress } from './BoardProgress';
import { useFlowBoard } from './useFlowBoard';
import { useBoardFeedback } from './useBoardFeedback';
import { useHintQuota } from './useHintQuota';
import { Confetti } from './Confetti';
import { track } from './analytics';
import { buildEndlessSequence } from '../game/endless';

function DifficultyPips({ value, max }: { value: number; max: number }) {
  return (
    <span className="df-diff" aria-label={`Độ khó ${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`df-pip${i < value ? ' on' : ''}`} />
      ))}
    </span>
  );
}

function BoardGame({ puzzle, initialState, onNext }: { puzzle: Puzzle; initialState?: PlayState; onNext: () => void }) {
  const b = useFlowBoard(puzzle, initialState);
  const { confetti } = useBoardFeedback(puzzle, b.state, b.won);
  const hintQuota = useHintQuota();
  useEffect(() => { if (b.won) track('endless_win', { puzzle: puzzle.id }); }, [b.won, puzzle.id]);
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
      <BoardProgress puzzle={puzzle} state={b.state} />
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Hoàn tác</button>
        <button
          className="df-btn"
          data-tour="hint"
          disabled={b.won || hintQuota.remaining <= 0}
          onClick={() => { if (!b.won && hintQuota.use()) { track('hint_used', { mode: 'endless' }); b.hint(); } }}
        >
          💡 {hintQuota.remaining}
        </button>
        <button className="df-btn" onClick={b.reset}>Làm lại</button>
      </div>
      {confetti && <Confetti />}
      {b.won && (
        <div className="df-win" role="dialog" aria-label="Hoàn thành">
          <div className="df-win-card" style={{ minWidth: 240 }}>
            <p className="df-title" style={{ fontSize: 24, margin: '0 0 16px' }}>Hoàn thành! 🎉</p>
            <button className="df-btn df-cta" style={{ width: '100%' }} onClick={onNext}>Màn tiếp →</button>
          </div>
        </div>
      )}
    </>
  );
}

export function EndlessGame({ puzzles, initialState }: { puzzles: Puzzle[]; initialState?: PlayState }) {
  const seq = useMemo(() => buildEndlessSequence(puzzles), [puzzles]);
  const maxDiff = useMemo(() => seq.reduce((m, p) => Math.max(m, p.difficulty), 1), [seq]);
  const [index, setIndex] = useState(0);
  const puzzle = seq[index];
  if (!puzzle) {
    return (
      <div className="df-board-wrap">
        <p className="df-title">Hết màn — quay lại sau nhé!</p>
      </div>
    );
  }
  return (
    <>
      <div className="df-endless-head">
        <span>Màn {index + 1}</span>
        <span className="df-diff-wrap">Độ khó <DifficultyPips value={puzzle.difficulty} max={maxDiff} /></span>
      </div>
      <BoardGame
        key={puzzle.id}
        puzzle={puzzle}
        initialState={index === 0 ? initialState : undefined}
        onNext={() => setIndex((i) => i + 1)}
      />
    </>
  );
}
