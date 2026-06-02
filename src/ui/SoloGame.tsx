'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Puzzle } from '../engine/types';
import { Board } from './Board';
import { useFlowBoard } from './useFlowBoard';
import { useStopwatch } from './useStopwatch';
import { DailyResult } from './DailyResult';
import { StreakCalendar } from './StreakCalendar';
import { useBoardFeedback } from './useBoardFeedback';
import { useHintQuota } from './useHintQuota';
import { Confetti } from './Confetti';
import { formatTime } from '../game/format';
import { fasterThanPercent, referenceMedianMs } from '../game/rank';
import { loadStats, saveStats, recordDailyWin, hasPlayed, gapDays, type DailyStats } from '../game/daily-stats';
import { justEarnedBadge, type Badge } from '../game/badges';
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

interface Result {
  timeText: string;
  fasterThan: number;
  streak?: number;
  bestStreak?: number;
  earnedBadge?: Badge | null;
  freezeUsed?: boolean;
}

/** A single-puzzle game with timer, share, and (optionally) daily-streak recording. */
export function SoloGame({ puzzle, dayNumber, recordStats, onPlayMore, playLabel }: SoloGameProps) {
  const b = useFlowBoard(puzzle);
  const [started, setStarted] = useState(false);
  const sw = useStopwatch(started && !b.won);
  const { confetti } = useBoardFeedback(puzzle, b.state, b.won);
  const hintQuota = useHintQuota();
  const [result, setResult] = useState<Result | null>(null);
  const [countdown, setCountdown] = useState('');
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (recordStats) setStats(loadStats(window.localStorage));
  }, [recordStats]);

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
    if (!recordStats) {
      setResult({ timeText: formatTime(ms), fasterThan });
      return;
    }
    const today = dailyDateISO(new Date());
    const prev = loadStats(window.localStorage);
    const freezeUsed = !hasPlayed(prev, today) && gapDays(prev.lastDate, today) === 2 && prev.freezeAvailable;
    const next = recordDailyWin(prev, today, ms);
    saveStats(next, window.localStorage);
    setStats(next);
    setResult({
      timeText: formatTime(ms),
      fasterThan,
      streak: next.streak,
      bestStreak: next.bestStreak,
      earnedBadge: justEarnedBadge(prev.streak, next.streak),
      freezeUsed,
    });
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
      {recordStats && stats && (
        <button
          className="df-chip"
          onClick={() => setShowCalendar(true)}
          aria-label="Xem lịch chuỗi"
        >
          🔥 {stats.streak}{stats.freezeAvailable ? ' 🧊' : ''} · 🏅 {stats.bestStreak} · 📅
        </button>
      )}
      <div className="df-timer">{formatTime(sw.ms)}</div>
      <div className="df-board-wrap">
        <div className="df-board">
          <Board puzzle={puzzle} state={b.state} svgRef={b.svgRef} onPointerDown={handlePointerDown} onPointerMove={b.onPointerMove} onPointerUp={b.onPointerUp} />
        </div>
      </div>
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Hoàn tác</button>
        <button
          className="df-btn"
          disabled={b.won || hintQuota.remaining <= 0}
          onClick={() => { if (!b.won && hintQuota.use()) b.hint(); }}
        >
          💡 {hintQuota.remaining}
        </button>
        <button className="df-btn" onClick={b.reset}>Làm lại</button>
      </div>
      {confetti && <Confetti />}
      {showCalendar && stats && <StreakCalendar stats={stats} onClose={() => setShowCalendar(false)} />}
      {result && (
        <DailyResult
          dayNumber={dayNumber}
          timeText={result.timeText}
          fasterThan={result.fasterThan}
          colorCount={puzzle.pairs.length}
          shareUrl={shareUrl(origin, puzzle.id)}
          streak={result.streak}
          bestStreak={result.bestStreak}
          earnedBadge={result.earnedBadge}
          freezeUsed={result.freezeUsed}
          countdownText={recordStats ? countdown : undefined}
          onPlayEndless={onPlayMore}
          playLabel={playLabel}
        />
      )}
    </>
  );
}
