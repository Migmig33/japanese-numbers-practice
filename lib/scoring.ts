export const BASE_POINTS = 10;
export const SPEED_WINDOW_MS = 3000;

/** Multiplier in effect after `streak` consecutive correct answers: ×1, ×2 from 3, ×3 from 6. */
export function nextMultiplier(streak: number): 1 | 2 | 3 {
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function speedBonus(ms: number): number {
  return Math.round(10 * Math.max(0, (SPEED_WINDOW_MS - ms) / SPEED_WINDOW_MS));
}

export type AnswerScore = {
  points: number;
  base: number;
  bonus: number;
  multiplier: 1 | 2 | 3;
  /** Consecutive-correct count after this answer. */
  streak: number;
};

/**
 * Score one answer. `streak` is the consecutive-correct count before this answer; a correct
 * answer extends it and is scored at the multiplier that extended streak earns. A miss
 * scores nothing and resets the multiplier to ×1.
 */
export function scoreAnswer({ correct, ms, streak }: { correct: boolean; ms: number; streak: number }): AnswerScore {
  if (!correct) return { points: 0, base: 0, bonus: 0, multiplier: 1, streak: 0 };
  const newStreak = streak + 1;
  const multiplier = nextMultiplier(newStreak);
  const bonus = speedBonus(ms);
  return { points: (BASE_POINTS + bonus) * multiplier, base: BASE_POINTS, bonus, multiplier, streak: newStreak };
}

/** Total XP needed to reach `level` (level 1 starts at 0; each level costs 100 more than the last). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}
