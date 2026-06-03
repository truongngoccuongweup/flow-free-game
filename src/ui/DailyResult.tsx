'use client';
import { useState } from 'react';
import { buildShareText } from '../game/share';
import { track } from './analytics';

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

export function DailyResult({
  dayNumber, timeText, fasterThan, colorCount, shareUrl,
  streak, bestStreak, earnedBadge, freezeUsed, countdownText, onPlayEndless, playLabel = 'Chơi Vô tận',
}: DailyResultProps) {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText({ dayNumber, timeText, fasterThan, streak: streak ?? 0, colorCount }, shareUrl);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareText);
      track('share', { day: dayNumber });
      setCopied(true);
    } catch {
      /* clipboard unavailable */
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
        <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'left', margin: '0 0 6px' }}>🔗 Rủ bạn chơi màn này — sao chép & gửi:</p>
        <div className="df-sharebox">
          <textarea className="df-sharetext" readOnly rows={4} value={shareText} onFocus={(e) => e.currentTarget.select()} />
        </div>
        <button className="df-btn df-cta" style={{ width: '100%' }} onClick={copy}>
          {copied ? 'Đã sao chép ✓' : '📋 Sao chép link & kết quả'}
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
