'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';
import { useStopwatch } from './useStopwatch';
import { DailyResult } from './DailyResult';
import { formatTime } from '../game/format';
import { fasterThanPercent, referenceMedianMs } from '../game/rank';
import { loadStats, saveStats, recordDailyWin } from '../game/daily-stats';
import { dailyDateISO } from '../game/level-repository';
import { secondsToNextMidnight, formatCountdown } from '../game/countdown';

export function DailyGame({ puzzle, dayNumber, onPlayEndless }: { puzzle: Puzzle; dayNumber: number; onPlayEndless: () => void }) {
  const b = useFlowBoard(puzzle);
  const sw = useStopwatch(!b.won);
  const [result, setResult] = useState<{ timeText: string; fasterThan: number; streak: number } | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!b.won || result) return;
    const ms = sw.elapsed();
    const date = dailyDateISO(new Date());
    const stats = recordDailyWin(loadStats(window.localStorage), date, ms);
    saveStats(stats, window.localStorage);
    setResult({
      timeText: formatTime(ms),
      fasterThan: fasterThanPercent(ms, referenceMedianMs(puzzle.difficulty)),
      streak: stats.streak,
    });
  }, [b.won, result, sw, puzzle]);

  useEffect(() => {
    if (!result) return;
    const tick = (): void => setCountdown(formatCountdown(secondsToNextMidnight(new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result]);

  return (
    <>
      <div className="df-timer">{formatTime(sw.ms)}</div>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board puzzle={puzzle} state={b.state} svgRef={b.svgRef} onPointerDown={b.onPointerDown} onPointerMove={b.onPointerMove} onPointerUp={b.onPointerUp} />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Undo</button>
        <button className="df-btn" onClick={b.reset}>Reset</button>
      </div>
      {result && (
        <DailyResult
          dayNumber={dayNumber}
          timeText={result.timeText}
          fasterThan={result.fasterThan}
          streak={result.streak}
          colorCount={puzzle.pairs.length}
          countdownText={countdown}
          onPlayEndless={onPlayEndless}
        />
      )}
    </>
  );
}
