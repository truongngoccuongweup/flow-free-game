// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStopwatch } from './useStopwatch';

describe('useStopwatch', () => {
  it('starts at 0 ms and exposes an elapsed() function', () => {
    const { result } = renderHook(() => useStopwatch(false));
    expect(result.current.ms).toBe(0);
    expect(typeof result.current.elapsed).toBe('function');
    expect(result.current.elapsed()).toBeGreaterThanOrEqual(0);
  });
});
