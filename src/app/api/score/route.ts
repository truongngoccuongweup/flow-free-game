import { NextResponse } from 'next/server';
import { redis, kvConfigured } from '../../../lib/kv';
import { sanitizeName, isValidMs, isValidDate, computeFasterThan } from '../../../game/leaderboard';

export const runtime = 'nodejs';

interface Body { date?: unknown; ms?: unknown; name?: unknown; cid?: unknown; }

export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const { date, ms, name, cid } = body;
  if (!isValidDate(date) || !isValidMs(ms) || typeof cid !== 'string' || cid.length < 4 || cid.length > 64) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  if (!kvConfigured || !redis) {
    return NextResponse.json({ ok: true, available: false, fasterThan: null });
  }
  const key = `lb:${date}`;
  try {
    await redis.hset('lbnames', { [cid]: sanitizeName(name) });
    const cur = await redis.zscore(key, cid);
    const best = cur == null ? ms : Math.min(Number(cur), ms);
    if (cur == null || ms < Number(cur)) {
      await redis.zadd(key, { score: ms, member: cid });
      await redis.expire(key, 60 * 60 * 24 * 40); // keep ~40 days
    }
    const total = await redis.zcard(key);
    const slower = await redis.zcount(key, `(${best}`, '+inf'); // strictly slower than best
    const rank = (await redis.zrank(key, cid)) ?? 0;
    return NextResponse.json({ ok: true, available: true, fasterThan: computeFasterThan(slower, total), total, rank: rank + 1 });
  } catch {
    return NextResponse.json({ ok: true, available: false, fasterThan: null });
  }
}
