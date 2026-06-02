import { describe, it, expect } from 'vitest';
import { fasterThanPercent, referenceMedianMs } from './rank';

describe('fasterThanPercent', () => {
  it('is 50 at the median', () => {
    expect(fasterThanPercent(50000, 50000)).toBe(50);
  });
  it('is higher when faster than the median, lower when slower', () => {
    expect(fasterThanPercent(20000, 50000)).toBeGreaterThan(50);
    expect(fasterThanPercent(90000, 50000)).toBeLessThan(50);
  });
  it('clamps to 1..99', () => {
    expect(fasterThanPercent(1, 50000)).toBeLessThanOrEqual(99);
    expect(fasterThanPercent(1, 50000)).toBeGreaterThanOrEqual(1);
    expect(fasterThanPercent(10_000_000, 50000)).toBeGreaterThanOrEqual(1);
  });
});

describe('referenceMedianMs', () => {
  it('grows with difficulty', () => {
    expect(referenceMedianMs(7)).toBeGreaterThan(referenceMedianMs(3));
  });
});
