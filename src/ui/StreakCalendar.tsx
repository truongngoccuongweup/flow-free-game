'use client';
import type { DailyStats } from '../game/daily-stats';
import { badgeForStreak } from '../game/badges';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n: number): string => String(n).padStart(2, '0');

export function StreakCalendar({ stats, onClose }: { stats: DailyStats; onClose: () => void }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const played = new Set(stats.playedDates);
  const iso = (d: number): string => `${year}-${pad(month + 1)}-${pad(d)}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const badge = badgeForStreak(stats.streak);
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(now);

  return (
    <div className="df-win" role="dialog" aria-label="Chuỗi" onClick={onClose}>
      <div className="df-win-card" style={{ minWidth: 300 }} onClick={(e) => e.stopPropagation()}>
        <p className="df-title" style={{ fontSize: 20, margin: 0 }}>Chuỗi của bạn</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '12px 0 4px' }}>
          <div><div style={{ fontSize: 26, fontWeight: 800 }}>🔥 {stats.streak}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Hiện tại</div></div>
          <div><div style={{ fontSize: 26, fontWeight: 800 }}>🏅 {stats.bestStreak}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Kỷ lục</div></div>
          <div><div style={{ fontSize: 26, fontWeight: 800 }}>{stats.freezeAvailable ? '🧊' : '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Freeze</div></div>
        </div>
        {badge && <p style={{ margin: '6px 0 0', fontSize: 13 }}>{badge.emoji} Huy hiệu: <b>{badge.label}</b></p>}
        <p style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'capitalize', margin: '16px 0 6px' }}>{monthLabel}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {WEEKDAYS.map((w) => <div key={w} style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>{w}</div>)}
          {cells.map((d, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                background: d && played.has(iso(d)) ? 'var(--brand)' : 'transparent',
                color: d && played.has(iso(d)) ? '#fff' : 'var(--muted)',
              }}
            >
              {d ?? ''}
            </div>
          ))}
        </div>
        <button className="df-btn" style={{ width: '100%', marginTop: 18 }} onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
