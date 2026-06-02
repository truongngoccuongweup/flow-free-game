import type { DailyEntry } from './level-repository';

export function dailyNumber(schedule: DailyEntry[], dateISO: string): number | null {
  const i = schedule.findIndex((e) => e.date === dateISO);
  return i === -1 ? null : i + 1;
}

export function dailyNumberById(schedule: DailyEntry[], id: string): number | null {
  const i = schedule.findIndex((e) => e.id === id);
  return i === -1 ? null : i + 1;
}
