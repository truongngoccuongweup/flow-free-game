import { describe, it, expect } from 'vitest';
import { buildShareText } from './share';

describe('buildShareText', () => {
  const r = { dayNumber: 142, timeText: '0:48', fasterThan: 73, streak: 8, colorCount: 5 };
  it('includes day number, time, rank, streak and url', () => {
    const out = buildShareText(r);
    expect(out).toContain('Daily Flow #142');
    expect(out).toContain('0:48');
    expect(out).toContain('73%');
    expect(out).toContain('🔥8');
    expect(out).toContain('dailyflow.app');
  });
  it('renders one square per color (spoiler-free)', () => {
    const out = buildShareText(r);
    const squareLine = out.split('\n').find((l) => /\p{Extended_Pictographic}/u.test(l) && !l.includes('Daily'))!;
    expect([...squareLine].length).toBe(5);
  });
  it('accepts a custom url', () => {
    expect(buildShareText(r, 'example.com')).toContain('example.com');
  });
});
