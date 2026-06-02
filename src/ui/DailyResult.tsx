'use client';
import { useState } from 'react';
import { buildShareText } from '../game/share';

interface DailyResultProps {
  dayNumber: number;
  timeText: string;
  fasterThan: number;
  streak: number;
  colorCount: number;
  countdownText: string;
  onPlayEndless: () => void;
}

export function DailyResult({ dayNumber, timeText, fasterThan, streak, colorCount, countdownText, onPlayEndless }: DailyResultProps) {
  const [copied, setCopied] = useState(false);
  const share = async (): Promise<void> => {
    const text = buildShareText({ dayNumber, timeText, fasterThan, streak, colorCount });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="df-win" role="dialog" aria-label="Kết quả">
      <div className="df-win-card">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>Daily Flow #{dayNumber}</p>
        <p className="df-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 46, margin: '4px 0' }}>{timeText}</p>
        <p style={{ margin: '0 0 18px' }}>Nhanh hơn {fasterThan}% · 🔥{streak}</p>
        <button className="df-btn df-cta" style={{ width: '100%' }} onClick={share}>
          {copied ? 'Đã copy! 📋' : 'Khoe kết quả'}
        </button>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '14px 0 8px' }}>Màn mới sau {countdownText}</p>
        <button className="df-btn" style={{ width: '100%' }} onClick={onPlayEndless}>Chơi Endless</button>
      </div>
    </div>
  );
}
