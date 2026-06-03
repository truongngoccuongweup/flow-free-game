'use client';
import { useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderRow } from '../game/leaderboard-api';
import { formatTime } from '../game/format';

interface State { loading: boolean; available: boolean; entries: LeaderRow[]; total: number }

export function Leaderboard({ date, cid, onClose }: { date: string; cid: string; onClose: () => void }) {
  const [s, setS] = useState<State>({ loading: true, available: false, entries: [], total: 0 });

  useEffect(() => {
    let alive = true;
    fetchLeaderboard(date).then((r) => { if (alive) setS({ loading: false, ...r }); });
    return () => { alive = false; };
  }, [date]);

  return (
    <div className="df-win" role="dialog" aria-label="Bảng xếp hạng" onClick={onClose}>
      <div className="df-win-card" style={{ minWidth: 300, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <p className="df-title" style={{ fontSize: 20, margin: 0 }}>🏆 Bảng xếp hạng</p>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '2px 0 12px' }}>Daily {date} · nhanh nhất</p>

        {s.loading && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}
        {!s.loading && !s.available && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Bảng xếp hạng sẽ bật khi máy chủ sẵn sàng.</p>
        )}
        {!s.loading && s.available && s.entries.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Chưa ai hoàn thành hôm nay — hãy là người đầu tiên!</p>
        )}
        {!s.loading && s.available && s.entries.length > 0 && (
          <ol className="df-lb">
            {s.entries.map((e) => (
              <li key={e.rank} className={e.cid === cid ? 'me' : ''}>
                <span className="r">{e.rank}</span>
                <span className="n">{e.name}</span>
                <span className="t">{formatTime(e.ms)}</span>
              </li>
            ))}
          </ol>
        )}

        <button className="df-btn" style={{ width: '100%', marginTop: 14 }} onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
