'use client';
import { useState } from 'react';
import { buildShareText } from '../game/share';

interface DailyResultProps {
  dayNumber: number;
  timeText: string;
  fasterThan: number;
  colorCount: number;
  shareUrl: string;
  streak?: number;
  bestStreak?: number;
  earnedBadge?: { emoji: string; label: string } | null;
  freezeUsed?: boolean;
  countdownText?: string;
  onPlayEndless: () => void;
  playLabel?: string;
}

type ShareNavigator = Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };

export function DailyResult({
  dayNumber, timeText, fasterThan, colorCount, shareUrl,
  streak, bestStreak, earnedBadge, freezeUsed, countdownText, onPlayEndless, playLabel = 'Chơi Endless',
}: DailyResultProps) {
  const [shared, setShared] = useState(false);

  const share = async (): Promise<void> => {
    const text = buildShareText({ dayNumber, timeText, fasterThan, streak: streak ?? 0, colorCount }, shareUrl);
    const nav = navigator as ShareNavigator;
    try {
      if (typeof nav.share === 'function') {
        await nav.share({ title: 'Daily Flow', text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
    } catch {
      /* user cancelled or APIs unavailable */
    }
  };

  return (
    <div className="df-win" role="dialog" aria-label="Kết quả">
      <div className="df-win-card">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>
          {dayNumber > 0 ? `Daily Flow #${dayNumber}` : 'Thử thách'}
        </p>
        <p className="df-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 46, margin: '4px 0' }}>{timeText}</p>
        <p style={{ margin: '0 0 6px' }}>
          Nhanh hơn {fasterThan}%{streak != null && streak > 0 ? ` · 🔥${streak}` : ''}
        </p>
        {freezeUsed && (
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--brand)' }}>🧊 Freeze đã cứu chuỗi của bạn!</p>
        )}
        {earnedBadge && (
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{earnedBadge.emoji} Mở khóa huy hiệu: {earnedBadge.label}!</p>
        )}
        {bestStreak != null && bestStreak > 0 && streak != null && streak < bestStreak && (
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--muted)' }}>Kỷ lục: 🏅 {bestStreak}</p>
        )}
        <div style={{ height: 12 }} />
        <button className="df-btn df-cta" style={{ width: '100%' }} onClick={share}>
          {shared ? 'Đã chia sẻ! 🔗' : 'Khoe & rủ bạn chơi'}
        </button>
        {countdownText && (
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '14px 0 8px' }}>Màn mới sau {countdownText}</p>
        )}
        <button className="df-btn" style={{ width: '100%', marginTop: countdownText ? 0 : 12 }} onClick={onPlayEndless}>
          {playLabel}
        </button>
      </div>
    </div>
  );
}
