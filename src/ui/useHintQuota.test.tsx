// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { quotaRemaining } from './useHintQuota';

describe('quotaRemaining', () => {
  it('returns full limit when nothing stored', () => {
    expect(quotaRemaining(null, '2026-06-02', 3)).toBe(3);
  });
  it('subtracts used for today', () => {
    expect(quotaRemaining(JSON.stringify({ date: '2026-06-02', used: 2 }), '2026-06-02', 3)).toBe(1);
  });
  it('resets when the stored date is not today', () => {
    expect(quotaRemaining(JSON.stringify({ date: '2026-06-01', used: 3 }), '2026-06-02', 3)).toBe(3);
  });
  it('never goes below zero', () => {
    expect(quotaRemaining(JSON.stringify({ date: '2026-06-02', used: 9 }), '2026-06-02', 3)).toBe(0);
  });
});
