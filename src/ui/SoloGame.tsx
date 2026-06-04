'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Puzzle } from '../engine/types';
import { Board } from './Board';
import { BoardProgress } from './BoardProgress';
import { useFlowBoard } from './useFlowBoard';
import { useStopwatch } from './useStopwatch';
import { DailyResult } from './DailyResult';
import { StreakCalendar } from './StreakCalendar';
import { Leaderboard } from './Leaderboard';
import { NameModal } from './NameModal';
import { useNickname } from './useNickname';
import { submitScore } from '../game/leaderboard-api';
import { useBoardFeedback } from './useBoardFeedback';
import { useHintQuota } from './useHintQuota';
import { Confetti } from './Confetti';
import { track } from './analytics';
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showName, setShowName] = useState(false);
  const nick = useNickname();
  const lastMsRef = useRef<number | null>(null);
  const today = dailyDateISO(new Date());

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

  // Submit the daily score and refine the on-screen "faster than %" with the real
  // server value (falls back to the local estimate if the leaderboard is unavailable).
  const submitAndUpdate = useCallback((ms: number, name: string) => {
    void submitScore({ date: today, ms, name, cid: nick.cid }).then(({ fasterThan }) => {
      if (fasterThan != null) setResult((r) => (r ? { ...r, fasterThan } : r));
    });
  }, [today, nick.cid]);

  useEffect(() => {
    if (!b.won || result) return;
    const ms = sw.elapsed();
    const fasterThan = fasterThanPercent(ms, referenceMedianMs(puzzle.difficulty));
    if (!recordStats) {
      track('challenge_win', { day: dayNumber, fasterThan });
      setResult({ timeText: formatTime(ms), fasterThan });
      return;
    }
    const today = dailyDateISO(new Date());
    const prev = loadStats(window.localStorage);
    const freezeUsed = !hasPlayed(prev, today) && gapDays(prev.lastDate, today) === 2 && prev.freezeAvailable;
    const next = recordDailyWin(prev, today, ms);
    saveStats(next, window.localStorage);
    setStats(next);
    track('daily_win', { day: dayNumber, fasterThan, streak: next.streak });
    setResult({
      timeText: formatTime(ms),
      fasterThan,
      streak: next.streak,
      bestStreak: next.bestStreak,
      earnedBadge: justEarnedBadge(prev.streak, next.streak),
      freezeUsed,
    });
    // submit to the daily leaderboard (ask for a nickname the first time)
    lastMsRef.current = ms;
    if (nick.name) submitAndUpdate(ms, nick.name);
    else setShowName(true);
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
      <BoardProgress puzzle={puzzle} state={b.state} />
      <div className="df-controls">
        <button className="df-btn" onClick={b.undo}>Hoàn tác</button>
        <button
          className="df-btn"
          data-tour="hint"
          disabled={b.won || hintQuota.remaining <= 0}
          onClick={() => { if (!b.won && hintQuota.use()) { track('hint_used', { mode: recordStats ? 'daily' : 'challenge' }); b.hint(); } }}
        >
          💡 {hintQuota.remaining}
        </button>
        <button className="df-btn" onClick={b.reset}>Làm lại</button>
      </div>
      {confetti && <Confetti />}
      {showCalendar && stats && <StreakCalendar stats={stats} onClose={() => setShowCalendar(false)} />}
      {showLeaderboard && <Leaderboard date={today} cid={nick.cid} onClose={() => setShowLeaderboard(false)} />}
      {showName && (
        <NameModal
          onSave={(n) => {
            nick.save(n);
            if (lastMsRef.current != null) submitAndUpdate(lastMsRef.current, n);
            setShowName(false);
          }}
          onClose={() => setShowName(false)}
        />
      )}
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
          onShowLeaderboard={recordStats ? () => setShowLeaderboard(true) : undefined}
          onPlayEndless={onPlayMore}
          playLabel={playLabel}
        />
      )}
    </>
  );
}
