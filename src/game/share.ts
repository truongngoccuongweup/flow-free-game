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
  return `Daily Flow #${r.dayNumber} ⚡ ${r.timeText}\n${squares}\nNhanh hơn ${r.fasterThan}% · 🔥${r.streak}\n${url}`;
}
