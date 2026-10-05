import { describe, expect, it } from "vitest";
import { ITEMS_BY_ID } from "./items";
import { KANJI_GUIDES } from "./strokes";

// Standard stroke counts.
const COUNTS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 5, 五: 4, 六: 4, 七: 2, 八: 2, 九: 2, 十: 2, 百: 6, 千: 3,
};

describe("kanji guides", () => {
  it.each(KANJI_GUIDES.map((g) => [g.char, g] as const))("%s has the right stroke count", (char, g) => {
    expect(g.strokes).toHaveLength(COUNTS[char]!);
  });

  it("keeps every point inside the box", () => {
    for (const g of KANJI_GUIDES)
      for (const s of g.strokes) {
        expect(s.length).toBeGreaterThanOrEqual(2);
        for (const [x, y] of s) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(100);
        }
      }
  });

  it("uses the dataset's primary reading", () => {
    for (const g of KANJI_GUIDES) {
      const id = g.value <= 10 ? `ones-${g.value}` : g.value === 100 ? "hundreds-100" : "thousands-1000";
      expect(ITEMS_BY_ID.get(id)!.readings[0]).toBe(g.reading);
      expect(ITEMS_BY_ID.get(id)!.jp).toBe(g.char);
    }
  });
});
