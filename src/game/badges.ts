export interface Badge {
  milestone: number;
  emoji: string;
  label: string;
}

export const MILESTONES: Badge[] = [
  { milestone: 3, emoji: '🌱', label: 'Khởi đầu' },
  { milestone: 7, emoji: '⭐', label: 'Một tuần' },
  { milestone: 14, emoji: '🔥', label: 'Hai tuần' },
  { milestone: 30, emoji: '🏆', label: 'Một tháng' },
  { milestone: 100, emoji: '💎', label: 'Trăm ngày' },
];

/** Highest milestone badge reached at a given streak (null below the first). */
export function badgeForStreak(streak: number): Badge | null {
  let earned: Badge | null = null;
  for (const m of MILESTONES) if (streak >= m.milestone) earned = m;
  return earned;
}

/** A badge that is unlocked exactly when crossing into `newStreak` (for the win celebration). */
export function justEarnedBadge(prevStreak: number, newStreak: number): Badge | null {
  return MILESTONES.find((m) => m.milestone === newStreak && prevStreak < newStreak) ?? null;
}
