import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

const shell = {
  width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const,
  alignItems: 'center', justifyContent: 'center', background: '#0E0F13', color: '#fff',
  fontFamily: 'sans-serif',
};

export function GET(req: Request): ImageResponse {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get('t');
  const n = searchParams.get('n') ?? '?';
  const r = searchParams.get('r') ?? '0';

  // Score card (shared from a win) vs. generic branded card (bare link).
  const content = t ? (
    <div style={shell}>
      <div style={{ fontSize: 40, color: '#8893AB' }}>{`Daily Flow #${n}`}</div>
      <div style={{ fontSize: 160, fontWeight: 800, color: '#4C6EF5' }}>{t}</div>
      <div style={{ fontSize: 44 }}>{`Nhanh hơn ${r}% người chơi`}</div>
      <div style={{ fontSize: 26, color: '#8893AB', marginTop: 24 }}>nối đường · lấp đầy bảng</div>
    </div>
  ) : (
    <div style={shell}>
      <div style={{ fontSize: 130, fontWeight: 800, color: '#4C6EF5' }}>Daily Flow</div>
      <div style={{ fontSize: 46, marginTop: 8 }}>Nối hai chấm cùng màu · lấp đầy bảng</div>
      <div style={{ fontSize: 30, color: '#8893AB', marginTop: 22 }}>Puzzle mỗi ngày · giữ chuỗi · rủ bạn cùng chơi</div>
    </div>
  );

  return new ImageResponse(content, { width: 1200, height: 630 });
}
