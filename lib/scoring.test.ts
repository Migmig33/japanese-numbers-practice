import { describe, expect, it } from "vitest";
import { levelForXp, nextMultiplier, scoreAnswer, speedBonus, xpForLevel } from "./scoring";

describe("speedBonus", () => {
  it("is 10 for an instant answer and 0 at or after 3 s", () => {
    expect(speedBonus(0)).toBe(10);
    expect(speedBonus(1500)).toBe(5);
    expect(speedBonus(3000)).toBe(0);
    expect(speedBonus(9000)).toBe(0);
  });
});

describe("nextMultiplier", () => {
  it("steps ×1 → ×2 at 3 → ×3 at 6", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 20].map(nextMultiplier)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);
  });
});

describe("scoreAnswer", () => {
  it("scores base + speed bonus at ×1", () => {
    expect(scoreAnswer({ correct: true, ms: 1800, streak: 0 })).toEqual({ points: 14, base: 10, bonus: 4, multiplier: 1, streak: 1 });
  });

  it("the third correct in a row scores ×2", () => {
    expect(scoreAnswer({ correct: true, ms: 1800, streak: 2 })).toMatchObject({ points: 28, multiplier: 2, streak: 3 });
  });

  it("the sixth correct in a row scores ×3", () => {
    expect(scoreAnswer({ correct: true, ms: 5000, streak: 5 })).toMatchObject({ points: 30, multiplier: 3, streak: 6 });
  });

  it("a miss scores 0 and resets to ×1", () => {
    expect(scoreAnswer({ correct: false, ms: 100, streak: 8 })).toEqual({ points: 0, base: 0, bonus: 0, multiplier: 1, streak: 0 });
  });
});

describe("levels", () => {
  it("level 1 starts at 0 XP and thresholds grow", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });
});
