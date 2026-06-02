// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { resolveInitialTheme } from './useTheme';

describe('resolveInitialTheme', () => {
  it('prefers a valid saved value', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });
  it('falls back to system preference when nothing valid is saved', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
    expect(resolveInitialTheme('garbage', true)).toBe('dark');
  });
});
