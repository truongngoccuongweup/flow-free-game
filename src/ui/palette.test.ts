import { describe, it, expect } from 'vitest';
import { flowColor, flowGlyph, FLOW_COLORS } from './palette';

describe('palette', () => {
  it('maps color index to a hex string', () => {
    expect(flowColor(0)).toBe('#E5484D');
    expect(flowColor(1)).toBe('#4C6EF5');
  });
  it('wraps around when index exceeds palette size', () => {
    expect(flowColor(FLOW_COLORS.length)).toBe(flowColor(0));
  });
  it('gives a non-empty glyph per color (colorblind aid)', () => {
    expect(flowGlyph(0).length).toBeGreaterThan(0);
    expect(flowGlyph(2)).not.toBe(flowGlyph(0));
  });
});
