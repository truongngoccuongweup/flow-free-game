export interface LeaderRow {
  rank: number;
  name: string;
  ms: number;
  cid?: string;
}

export async function submitScore(p: { date: string; ms: number; name: string; cid: string }): Promise<{ fasterThan: number | null }> {
  try {
    const r = await fetch('/api/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(p),
    });
    const j = (await r.json()) as { fasterThan?: number | null };
    return { fasterThan: typeof j.fasterThan === 'number' ? j.fasterThan : null };
  } catch {
    return { fasterThan: null };
  }
}

export async function fetchLeaderboard(date: string): Promise<{ available: boolean; entries: LeaderRow[]; total: number }> {
  try {
    const r = await fetch(`/api/leaderboard?date=${encodeURIComponent(date)}`);
    const j = (await r.json()) as { available?: boolean; entries?: LeaderRow[]; total?: number };
    return { available: Boolean(j.available), entries: j.entries ?? [], total: j.total ?? 0 };
  } catch {
    return { available: false, entries: [], total: 0 };
  }
}
