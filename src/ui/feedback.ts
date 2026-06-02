'use client';
// Runtime-synthesised sound effects (Web Audio — no asset files) + haptics.
// All functions no-op safely when the APIs are unavailable (SSR / jsdom / unsupported).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.05): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(c.destination);
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
  osc.start(t);
  osc.stop(t + durMs / 1000);
}

export const sfx = {
  connect: (): void => tone(320, 45, 'sine', 0.035),
  complete: (): void => tone(680, 90, 'triangle', 0.05),
  win: (): void => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 170, 'triangle', 0.06), i * 95));
  },
};

export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}
