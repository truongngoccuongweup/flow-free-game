// Pure helpers shared by the leaderboard API + client (no I/O).

export function sanitizeName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  const cleaned = Array.from(s)
    .filter((c) => c.charCodeAt(0) >= 32) // drop control chars, keep spaces/letters
    .join('')
    .trim()
    .slice(0, 20);
  return cleaned.length > 0 ? cleaned : 'Người chơi';
}

export function isValidMs(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 1000 && n <= 3_600_000;
}

export function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** % of other players you beat, given how many were strictly slower and the total (incl. you). */
export function computeFasterThan(slower: number, total: number): number {
  if (total <= 1) return 99; // first/only player
  return Math.min(99, Math.max(1, Math.round((slower / (total - 1)) * 100)));
}
