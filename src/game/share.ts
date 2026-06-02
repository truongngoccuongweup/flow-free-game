export interface ShareResult {
  dayNumber: number;
  timeText: string;
  fasterThan: number;
  streak: number;
  colorCount: number;
}

const SQUARES = ['🟥', '🟦', '🟩', '🟨', '🟧', '🟫', '🟪', '⬛'] as const;

export function buildShareText(r: ShareResult, url = 'dailyflow.app'): string {
  const squares = Array.from({ length: r.colorCount }, (_, i) => SQUARES[i % SQUARES.length]).join('');
  const head = r.dayNumber > 0 ? `Daily Flow #${r.dayNumber}` : 'Daily Flow';
  const stats = r.streak > 0 ? `Nhanh hơn ${r.fasterThan}% · 🔥${r.streak}` : `Nhanh hơn ${r.fasterThan}%`;
  return `${head} ⚡ ${r.timeText}\n${squares}\n${stats}\n${url}`;
}
