'use client';
import { Board } from './Board';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';

// A tiny, fully-solved 2x2 board purely to illustrate the goal.
const demoPuzzle: Puzzle = {
  id: 'demo', size: [2, 2], difficulty: 1,
  pairs: [
    { color: 0, a: [0, 0], b: [1, 0] },
    { color: 2, a: [0, 1], b: [1, 1] },
  ],
};
const demoState: PlayState = { active: null, paths: { 0: [[0, 0], [1, 0]], 2: [[0, 1], [1, 1]] } };

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="df-win" role="dialog" aria-label="Cách chơi">
      <div className="df-win-card" style={{ maxWidth: 320 }}>
        <p className="df-logo" style={{ fontSize: 22 }}>Cách chơi</p>
        <div style={{ width: 150, margin: '14px auto 18px' }}>
          <div className="df-board" style={{ padding: 10 }}>
            <Board puzzle={demoPuzzle} state={demoState} />
          </div>
        </div>
        <ul style={{ textAlign: 'left', margin: '0 0 20px', paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
          <li>Miết nối hai chấm <b>cùng màu</b>.</li>
          <li><b>Lấp đầy</b> cả bảng — đường <b>không cắt nhau</b>.</li>
          <li>Xong càng nhanh, hạng càng cao ⚡</li>
        </ul>
        <button className="df-btn df-cta" style={{ width: '100%' }} onClick={onDone}>Bắt đầu chơi</button>
      </div>
    </div>
  );
}
