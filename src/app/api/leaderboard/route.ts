import { NextResponse } from 'next/server';
import { redis, kvConfigured } from '../../../lib/kv';
import { isValidDate } from '../../../game/leaderboard';

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  const date = new URL(req.url).searchParams.get('date');
  if (!isValidDate(date)) {
    return NextResponse.json({ available: false, entries: [], total: 0 }, { status: 400 });
  }
  if (!kvConfigured || !redis) {
    return NextResponse.json({ available: false, entries: [], total: 0 });
  }
  const r = redis;
  const key = `lb:${date}`;
  try {
    // ascending score = fastest first
    const raw = (await r.zrange(key, 0, 19, { withScores: true })) as (string | number)[];
    const cids: string[] = [];
    const mss: number[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      cids.push(String(raw[i]));
      mss.push(Number(raw[i + 1]));
    }
    const names = await Promise.all(cids.map((c) => r.hget<string>('lbnames', c)));
    const entries = cids.map((cid, i) => ({ rank: i + 1, name: names[i] ?? 'Người chơi', ms: mss[i], cid }));
    const total = await r.zcard(key);
    return NextResponse.json({ available: true, entries, total });
  } catch {
    return NextResponse.json({ available: false, entries: [], total: 0 });
  }
}
