'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { indexById, puzzleForDate, dailyDateISO, type DailyEntry } from '../game/level-repository';
import { dailyNumber, dailyNumberById } from '../game/daily';
import { puzzleIdFromSearch } from '../game/share-url';
import { EndlessGame } from '../ui/EndlessGame';
import { SoloGame } from '../ui/SoloGame';
import { Onboarding } from '../ui/Onboarding';
import { useTheme } from '../ui/useTheme';
import { useFeedbackPrefs } from '../ui/useFeedbackPrefs';
import { track } from '../ui/analytics';

const ONBOARD_KEY = 'daily-flow-onboarded';

function FeedbackToggle() {
  const { enabled, toggle } = useFeedbackPrefs();
  return (
    <button className="df-icon-btn" onClick={toggle} aria-label={enabled ? 'Tắt âm thanh' : 'Bật âm thanh'}>
      {enabled ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4z" /><path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
  );
}

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
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [leftChallenge, setLeftChallenge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const sid = puzzleIdFromSearch(window.location.search);
    setSharedId(sid);
    if (sid) track('challenge_opened', { puzzle: sid });
    try {
      if (!window.localStorage.getItem(ONBOARD_KEY)) setShowOnboarding(true);
    } catch {
      /* storage unavailable */
    }
    Promise.all([
      loadEndlessPuzzles(),
      fetch('/levels/daily-schedule.json').then((r) => r.json() as Promise<DailyEntry[]>),
    ])
      .then(([p, s]) => { setPuzzles(p); setSchedule(s); })
      .catch(() => setFailed(true));
  }, []);

  const dismissOnboarding = (): void => {
    try { window.localStorage.setItem(ONBOARD_KEY, '1'); } catch { /* ignore */ }
    track('onboarding_done');
    setShowOnboarding(false);
  };

  const byId = puzzles ? indexById(puzzles) : null;
  const today = dailyDateISO(new Date());
  const daily = byId && schedule ? puzzleForDate(schedule, byId, today) : null;
  const dayNo = schedule ? dailyNumber(schedule, today) : null;

  const challenge = !leftChallenge && sharedId && byId ? byId.get(sharedId) ?? null : null;

  return (
    <main className="df-shell">
      <header className="df-head">
        <div>
          <div className="df-logo">Daily Flow</div>
          <p className="df-sub">Nối hai chấm cùng màu · lấp đầy bảng</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <FeedbackToggle />
          <ThemeToggle />
        </div>
      </header>

      {failed && <p style={{ color: 'var(--muted)' }}>Không tải được màn chơi.</p>}
      {!failed && !puzzles && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}

      {challenge ? (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 8px' }}>Bạn được mời chơi một màn 🔗</p>
          <SoloGame
            key={`c-${challenge.id}`}
            puzzle={challenge}
            dayNumber={schedule ? dailyNumberById(schedule, challenge.id) ?? 0 : 0}
            recordStats={false}
            onPlayMore={() => { setLeftChallenge(true); setMode('daily'); }}
            playLabel="Chơi màn hôm nay"
          />
        </>
      ) : (
        puzzles && (
          <>
            <div className="df-seg" role="tablist">
              <button className={mode === 'daily' ? 'on' : ''} onClick={() => setMode('daily')}>Hằng ngày</button>
              <button className={mode === 'endless' ? 'on' : ''} onClick={() => setMode('endless')}>Vô tận</button>
            </div>
            {mode === 'endless' && <EndlessGame puzzles={puzzles} />}
            {mode === 'daily' &&
              (daily && dayNo
                ? <SoloGame key={`d-${daily.id}`} puzzle={daily} dayNumber={dayNo} recordStats onPlayMore={() => setMode('endless')} playLabel="Chơi Vô tận" />
                : <p style={{ color: 'var(--muted)' }}>Hôm nay chưa có màn.</p>)}
          </>
        )
      )}

      {showOnboarding && <Onboarding onDone={dismissOnboarding} />}
    </main>
  );
}
