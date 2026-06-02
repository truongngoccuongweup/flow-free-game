'use client';
import { useEffect, useState } from 'react';
import type { Puzzle } from '../engine/types';
import { loadEndlessPuzzles } from '../game/level-loader';
import { EndlessGame } from '../ui/EndlessGame';

export default function Home() {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadEndlessPuzzles().then(setPuzzles).catch(() => setFailed(true));
  }, []);

  return (
    <main className="df-shell">
      <header style={{ padding: '20px 0 4px' }}>
        <span className="df-title" style={{ fontSize: 22 }}>Daily Flow</span>
        <p style={{ color: 'var(--muted)', margin: '2px 0 0', fontSize: 13 }}>Nối hai chấm cùng màu · lấp đầy bảng</p>
      </header>
      {failed && <p style={{ color: 'var(--muted)' }}>Không tải được màn chơi.</p>}
      {!failed && !puzzles && <p style={{ color: 'var(--muted)' }}>Đang tải…</p>}
      {puzzles && <EndlessGame puzzles={puzzles} />}
    </main>
  );
}
