import { describe, it, expect } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it('formats milliseconds as M:SS', () => {
    expect(formatTime(48000)).toBe('0:48');
    expect(formatTime(754000)).toBe('12:34');
    expect(formatTime(0)).toBe('0:00');
  });
  it('floors sub-second remainder and clamps negatives', () => {
    expect(formatTime(48999)).toBe('0:48');
    expect(formatTime(-5)).toBe('0:00');
  });
});
