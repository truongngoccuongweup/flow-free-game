import { describe, it, expect } from 'vitest';
import { secondsToNextMidnight, formatCountdown } from './countdown';

describe('secondsToNextMidnight', () => {
  it('counts seconds to the next local midnight', () => {
    expect(secondsToNextMidnight(new Date(2026, 5, 2, 23, 0, 0))).toBe(3600);
    expect(secondsToNextMidnight(new Date(2026, 5, 2, 0, 0, 0))).toBe(86400);
  });
});

describe('formatCountdown', () => {
  it('formats seconds as HH:MM:SS', () => {
    expect(formatCountdown(3661)).toBe('01:01:01');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});
