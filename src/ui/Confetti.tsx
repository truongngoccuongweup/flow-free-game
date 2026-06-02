'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#E5484D', '#4C6EF5', '#22C55E', '#FACC15', '#F97316', '#EC4899', '#A855F7', '#22D3EE'];

/** A lightweight one-shot canvas confetti burst (no dependencies). Mount it to fire. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);
    const N = 90;
    const parts = Array.from({ length: N }, (_, i) => ({
      x: W / 2,
      y: H * 0.36,
      vx: (((i * 73) % 100) / 100 - 0.5) * 24 * dpr,
      vy: (-(((i * 37) % 100) / 100) * 17 - 7) * dpr,
      r: (3 + (i % 3)) * dpr,
      color: COLORS[i % COLORS.length],
    }));
    const g = 0.6 * dpr;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number): void => {
      const e = t - start;
      c.clearRect(0, 0, W, H);
      c.globalAlpha = Math.max(0, 1 - e / 1300);
      for (const p of parts) {
        p.vy += g;
        p.x += p.vx;
        p.y += p.vy;
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, p.r, p.r);
      }
      if (e < 1300) raf = requestAnimationFrame(tick);
      else c.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, width: '100%', height: '100%' }}
    />
  );
}
