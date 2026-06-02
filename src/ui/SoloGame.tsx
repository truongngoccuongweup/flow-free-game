'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Puzzle } from '../engine/types';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';
import { useStopwatch } from './useStopwatch';
import { DailyResult } from './DailyResult';
import { useBoardFeedback } from './useBoardFeedback';
import { Confetti } from './Confetti';
import { formatTime } from '../game/format';
import { fasterThanPercent, referenceMedianMs } from '../game/rank';
import { loadStats, saveStats, recordDailyWin } from '../game/daily-stats';
import { dailyDateISO } from '../game/level-repository';
import { secondsToNextMidnight, formatCountdown } from '../game/countdown';
import { shareUrl } from '../game/share-url';

interface SoloGameProps {
  puzzle: Puzzle;
  dayNumber: number;       // >0 shows "#N"; 0 = a shared challenge
  recordStats: boolean;    // persist daily streak/best-time (Daily only)
  onPlayMore: () => void;
  playLabel: string;
}

/** A single-puzzle game with timer, share, and (optionally) daily-streak recording. */
export function SoloGame({ puzzle, dayNumber, recordStats, onPlayMore, playLabel }: SoloGameProps) {
  const b = useFlowBoard(puzzle);
  const [started, setStarted] = useState(false);
  const sw = useStopwatch(started && !b.won);
  const { confetti } = useBoardFeedback(puzzle, b.state, b.won);
  const [result, setResult] = useState<{ timeText: string; fasterThan: number; streak?: number } | null>(null);
  const [countdown, setCountdown] = useState('');

  const handlePointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      setStarted(true); // start the clock on the first move
      b.onPointerDown(e);
    },
    [b],
  );

  useEffect(() => {
    if (!b.won || result) return;
    const ms = sw.elapsed();
    const fasterThan = fasterThanPercent(ms, referenceMedianMs(puzzle.difficulty));
    let streak: number | undefined;
    if (recordStats) {
      const stats = recordDailyWin(loadStats(window.localStorage), dailyDateISO(new Date()), ms);
      saveStats(stats, window.localStorage);
      streak = stats.streak;
    }
    setResult({ timeText: formatTime(ms), fasterThan, streak });
  }, [b.won, result, sw, puzzle, recordStats]);

  useEffect(() => {
    if (!result || !recordStats) return;
    const tick = (): void => setCountdown(formatCountdown(secondsToNextMidnight(new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result, recordStats]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <div className="df-timer">{formatTime(sw.ms)}</div>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board puzzle={puzzle} state={b.state} svgRef={b.svgRef} onPointerDown={handlePointerDown} onPointerMove={b.onPointerMove} onPointerUp={b.onPointerUp} />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Undo</button>
        <button className="df-btn" onClick={b.reset}>Reset</button>
      </div>
      {confetti && <Confetti />}
      {result && (
        <DailyResult
          dayNumber={dayNumber}
          timeText={result.timeText}
          fasterThan={result.fasterThan}
          colorCount={puzzle.pairs.length}
          shareUrl={shareUrl(origin, puzzle.id)}
          streak={result.streak}
          countdownText={recordStats ? countdown : undefined}
          onPlayEndless={onPlayMore}
          playLabel={playLabel}
        />
      )}
    </>
  );
}
