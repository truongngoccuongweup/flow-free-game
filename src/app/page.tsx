'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { indexById, puzzleForDate, dailyDateISO, type DailyEntry } from '../game/level-repository';
import { dailyNumber } from '../game/daily';
import { EndlessGame } from '../ui/EndlessGame';
import { DailyGame } from '../ui/DailyGame';
import { useTheme } from '../ui/useTheme';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button className="df-icon-btn" onClick={toggle} aria-label={dark ? 'Chuyển sáng' : 'Chuyển tối'}>
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default function Home() {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [schedule, setSchedule] = useState<DailyEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'daily' | 'endless'>('daily');

  useEffect(() => {
    Promise.all([
      loadEndlessPuzzles(),
      fetch('/levels/daily-schedule.json').then((r) => r.json() as Promise<DailyEntry[]>),
    ])
      .then(([p, s]) => { setPuzzles(p); setSchedule(s); })
      .catch(() => setFailed(true));
  }, []);

  const today = dailyDateISO(new Date());
  const daily = puzzles && schedule ? puzzleForDate(schedule, indexById(puzzles), today) : null;
  const dayNo = schedule ? dailyNumber(schedule, today) : null;

  return (
    <main className="df-shell">
      <header className="df-head">
        <div>
          <div className="df-logo">Daily Flow</div>
          <p className="df-sub">Nối hai chấm cùng màu · lấp đầy bảng</p>
        </div>
        <ThemeToggle />
      </header>
      <div className="df-seg" role="tablist">
        <button className={mode === 'daily' ? 'on' : ''} onClick={() => setMode('daily')}>Daily</button>
        <button className={mode === 'endless' ? 'on' : ''} onClick={() => setMode('endless')}>Endless</button>
      </div>
      {failed && <p style={{ color: 'var(--muted)' }}>Không tải được màn chơi.</p>}
      {!failed && !puzzles && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}
      {puzzles && mode === 'endless' && <EndlessGame puzzles={puzzles} />}
      {puzzles && mode === 'daily' &&
        (daily && dayNo
          ? <DailyGame key={daily.id} puzzle={daily} dayNumber={dayNo} onPlayEndless={() => setMode('endless')} />
          : <p style={{ color: 'var(--muted)' }}>Hôm nay chưa có màn Daily.</p>)}
    </main>
  );
}
