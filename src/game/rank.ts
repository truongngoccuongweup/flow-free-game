// Stub model until a backend collects real solve-time distributions (see spec §9).
export function referenceMedianMs(difficulty: number): number {
  return 20000 + difficulty * 8000;
}

export function fasterThanPercent(timeMs: number, medianMs: number): number {
  const k = 0.0012; // logistic steepness per ms
  const p = 1 / (1 + Math.exp(k * (timeMs - medianMs)));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}
