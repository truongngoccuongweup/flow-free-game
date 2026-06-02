export const FLOW_COLORS = [
  '#E5484D', '#4C6EF5', '#22C55E', '#FACC15',
  '#F97316', '#22D3EE', '#EC4899', '#A855F7',
] as const;

export const FLOW_GLYPHS = ['▲', '●', '■', '◆', '✚', '◗', '★', '✦'] as const;

export const flowColor = (i: number): string => FLOW_COLORS[((i % FLOW_COLORS.length) + FLOW_COLORS.length) % FLOW_COLORS.length];
export const flowGlyph = (i: number): string => FLOW_GLYPHS[((i % FLOW_GLYPHS.length) + FLOW_GLYPHS.length) % FLOW_GLYPHS.length];
