'use client';
import type { Puzzle } from '../engine/types';
import { boardProgress, type PlayState } from '../game/play-state';

export function BoardProgress({ puzzle, state }: { puzzle: Puzzle; state: PlayState }) {
  const { filled, total, pairsDone, pairsTotal } = boardProgress(puzzle, state);
  const pct = Math.round((filled / total) * 100);
  const connectedAllButNotFull = pairsDone === pairsTotal && filled < total;

  return (
    <div className="df-progress">
      <div className="df-progress-track">
        <div className="df-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className={`df-progress-label${connectedAllButNotFull ? ' hint' : ''}`}>
        {connectedAllButNotFull
          ? `Đã nối hết màu — còn ${total - filled} ô trống cần lấp để thắng (${pct}%)`
          : `Đã lấp ${pct}% · ${pairsDone}/${pairsTotal} màu nối xong`}
      </div>
    </div>
  );
}
