import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

export function GET(req: Request): ImageResponse {
  const { searchParams } = new URL(req.url);
  const n = searchParams.get('n') ?? '?';
  const t = searchParams.get('t') ?? '--:--';
  const r = searchParams.get('r') ?? '0';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0E0F13', color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, color: '#8893AB' }}>Daily Flow #{n}</div>
        <div style={{ fontSize: 160, fontWeight: 800, color: '#4C6EF5' }}>{t}</div>
        <div style={{ fontSize: 44 }}>Nhanh hơn {r}% người chơi</div>
        <div style={{ fontSize: 28, color: '#8893AB', marginTop: 24 }}>dailyflow · nối đường, lấp đầy bảng</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
