import { describe, it, expect } from 'vitest';
import { sanitizeName, isValidMs, isValidDate, computeFasterThan } from './leaderboard';

describe('sanitizeName', () => {
  it('trims, caps length, keeps spaces, falls back', () => {
    expect(sanitizeName('  Cường  ')).toBe('Cường');
    expect(sanitizeName('a'.repeat(40)).length).toBe(20);
    expect(sanitizeName('')).toBe('Người chơi');
    expect(sanitizeName(123)).toBe('Người chơi');
    expect(sanitizeName('An Khang')).toBe('An Khang');
  });
});

describe('isValidMs', () => {
  it('accepts sane solve times only', () => {
    expect(isValidMs(48000)).toBe(true);
    expect(isValidMs(500)).toBe(false);       // too fast
    expect(isValidMs(9_999_999)).toBe(false);  // too slow
    expect(isValidMs('48000')).toBe(false);
  });
});

describe('isValidDate', () => {
  it('matches YYYY-MM-DD', () => {
    expect(isValidDate('2026-06-02')).toBe(true);
    expect(isValidDate('2026/06/02')).toBe(false);
    expect(isValidDate(20260602)).toBe(false);
  });
});

describe('computeFasterThan', () => {
  it('99 when sole player; scales with others beaten', () => {
    expect(computeFasterThan(0, 1)).toBe(99);
    expect(computeFasterThan(0, 2)).toBe(1);   // slowest of 2
    expect(computeFasterThan(1, 2)).toBe(99);  // beat the only other (clamped)
    expect(computeFasterThan(5, 11)).toBe(50); // beat 5 of 10 others
  });
});
