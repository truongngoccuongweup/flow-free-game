import { describe, it, expect } from 'vitest';
import { badgeForStreak, justEarnedBadge } from './badges';

describe('badgeForStreak', () => {
  it('returns null below the first milestone', () => {
    expect(badgeForStreak(2)).toBeNull();
  });
  it('returns the highest milestone reached', () => {
    expect(badgeForStreak(3)?.milestone).toBe(3);
    expect(badgeForStreak(10)?.milestone).toBe(7);
    expect(badgeForStreak(500)?.milestone).toBe(100);
  });
});

describe('justEarnedBadge', () => {
  it('fires only when crossing exactly into a milestone', () => {
    expect(justEarnedBadge(6, 7)?.milestone).toBe(7);
    expect(justEarnedBadge(7, 8)).toBeNull();
    expect(justEarnedBadge(2, 3)?.milestone).toBe(3);
  });
});
