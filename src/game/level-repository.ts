import type { Puzzle } from '../engine/types';

export interface DailyEntry { date: string; id: string; }

export function indexById(puzzles: Puzzle[]): Map<string, Puzzle> {
  return new Map(puzzles.map((p) => [p.id, p]));
}

export function dailyDateISO(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function puzzleForDate(
  schedule: DailyEntry[],
  byId: Map<string, Puzzle>,
  dateISO: string,
): Puzzle | null {
  const entry = schedule.find((e) => e.date === dateISO);
  if (!entry) return null;
  return byId.get(entry.id) ?? null;
}

export function endlessOrder(puzzles: Puzzle[]): Puzzle[] {
  return [...puzzles].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
}
