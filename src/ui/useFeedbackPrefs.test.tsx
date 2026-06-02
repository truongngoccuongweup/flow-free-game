// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFeedbackEnabled } from './useFeedbackPrefs';

describe('readFeedbackEnabled', () => {
  it('defaults to enabled when nothing/garbage stored', () => {
    expect(readFeedbackEnabled(null)).toBe(true);
    expect(readFeedbackEnabled('on')).toBe(true);
    expect(readFeedbackEnabled('whatever')).toBe(true);
  });
  it('is disabled only when explicitly off', () => {
    expect(readFeedbackEnabled('off')).toBe(false);
  });
});
