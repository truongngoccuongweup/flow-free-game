'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { indexById, puzzleForDate, dailyDateISO, type DailyEntry } from '../game/level-repository';
import { dailyNumber } from '../game/daily';
import { EndlessGame } from '../ui/EndlessGame';
import { DailyGame } from '../ui/DailyGame';

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
      <header style={{ padding: '20px 0 4px' }}>
        <span className="df-title" style={{ fontSize: 22 }}>Daily Flow</span>
        <p style={{ color: 'var(--muted)', margin: '2px 0 0', fontSize: 13 }}>Nối hai chấm cùng màu · lấp đầy bảng</p>
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
