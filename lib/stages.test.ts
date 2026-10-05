import { describe, expect, it } from "vitest";
import { numberKanji, numberReading } from "./bignumbers";
import {
  buildStageRound, checkAnswer, clampStage, nextStage, numberOptions, PASS_RATIO, passed,
  ROUND_NUMBERS_PER_ROUND, STAGES, stageNumbers, type Question,
} from "./stages";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const isRound = (n: number) => n >= 10 && n % 10 === 0;

describe("stage rounds", () => {
  it("includes three zero-heavy numbers every time", () => {
    for (const stage of [2, 3] as const) {
      for (let s = 0; s < 40; s++) {
        const ns = stageNumbers(stage, 12, seeded(s));
        expect(ns).toHaveLength(12);
        expect(new Set(ns).size).toBe(12);
        expect(ns.filter(isRound).length).toBeGreaterThanOrEqual(ROUND_NUMBERS_PER_ROUND);
      }
    }
  });

  it("stays inside each stage's ceiling and is always speakable", () => {
    for (const stage of [2, 3] as const) {
      for (let s = 0; s < 20; s++) {
        for (const n of stageNumbers(stage, 12, seeded(s))) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(STAGES[stage].max);
          expect(() => numberReading(n)).not.toThrow();
        }
      }
    }
  });

  it("reaches 万 in stage 2 and 億 in stage 3", () => {
    expect(STAGES[2].max).toBe(9_999_999);
    expect(STAGES[3].max).toBe(1_000_000_000);
  });
});

describe("buildStageRound", () => {
  it("stage 1 keeps the place-by-place chooser", () => {
    const round = buildStageRound(1, {}, seeded(1));
    expect(round).toHaveLength(12);
    expect(round.every((q) => q.kind === "build")).toBe(true);
  });

  it("every stage's round carries its share of zero-heavy numbers", () => {
    for (const stage of [1, 2, 3] as const) {
      for (let s = 0; s < 25; s++) {
        const round = buildStageRound(stage, {}, seeded(s));
        const numbers = round.map((q) =>
          q.kind === "build" ? Number(q.prompt.replace(/,/g, "")) : q.n,
        );
        const rounded = numbers.filter((n) => Number.isFinite(n) && n >= 10 && n % 10 === 0);
        expect(rounded.length, `stage ${stage} seed ${s}`).toBeGreaterThanOrEqual(ROUND_NUMBERS_PER_ROUND);
      }
    }
  });

  it("still mixes in the native words when asked", () => {
    const round = buildStageRound(1, { native: true }, seeded(4));
    expect(round.filter((q) => q.id.startsWith("native-")).length).toBeGreaterThan(0);
    expect(round).toHaveLength(12);
  });

  it("stage 2 asks for the number, with the answer among the options", () => {
    const round = buildStageRound(2, {}, seeded(2));
    expect(round.every((q) => q.kind === "identify")).toBe(true);
    for (const q of round) {
      if (q.kind !== "identify") continue;
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.n);
      expect(new Set(q.options).size).toBe(4);
      expect(q.kanji).toBe(numberKanji(q.n));
    }
  });

  it("stage 3 asks for the reading with no options", () => {
    const round = buildStageRound(3, {}, seeded(3));
    expect(round.every((q) => q.kind === "recall")).toBe(true);
    for (const q of round) {
      if (q.kind !== "recall") continue;
      expect(q.reading).toBe(numberReading(q.n));
    }
  });
});

describe("numberOptions", () => {
  it("offers four distinct, plausible numbers including the right one", () => {
    for (const n of [10, 600, 3_000_000, 1_000_000_000, 12_345]) {
      for (let s = 0; s < 20; s++) {
        const opts = numberOptions(n, seeded(s));
        expect(opts).toHaveLength(4);
        expect(opts).toContain(n);
        expect(new Set(opts).size).toBe(4);
        for (const o of opts) {
          expect(Number.isInteger(o)).toBe(true);
          expect(o).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("confuses by a place, which is the mistake worth catching", () => {
    const opts = numberOptions(600, seeded(1), 8);
    expect(opts.some((o) => o === 60 || o === 6000)).toBe(true);
  });
});

describe("checkAnswer", () => {
  const identify: Question = {
    kind: "identify", id: "i-600", n: 600, kanji: "六百", reading: "roppyaku", options: [60, 600, 6000, 660],
  };
  const recall: Question = { kind: "recall", id: "r-10000", n: 10_000, kanji: "一万", reading: "ichiman" };

  it("marks the chosen number", () => {
    expect(checkAnswer(identify, 600)).toBe(true);
    expect(checkAnswer(identify, 60)).toBe(false);
    expect(checkAnswer(identify, null)).toBe(false);
  });

  it("marks the typed reading, forgiving spacing and long vowels", () => {
    expect(checkAnswer(recall, "ichiman")).toBe(true);
    expect(checkAnswer(recall, "  ICHIMAN ")).toBe(true);
    expect(checkAnswer(recall, "man")).toBe(false);
    expect(checkAnswer(recall, "")).toBe(false);
    const big: Question = { kind: "recall", id: "r", n: 304, kanji: "三百四", reading: "sanbyaku yon" };
    expect(checkAnswer(big, "sanbyaku shi")).toBe(true);
    expect(checkAnswer(big, "sanbyakuyon")).toBe(true);
  });
});

describe("passing", () => {
  it("opens the next stage at 70%", () => {
    expect(PASS_RATIO).toBe(0.7);
    expect(passed(9, 12)).toBe(true); // 75%
    expect(passed(8, 12)).toBe(false); // 66%
    expect(passed(7, 10)).toBe(true);
    expect(passed(0, 0)).toBe(false);
  });

  it("walks the stages and stops at the last", () => {
    expect(nextStage(1)).toBe(2);
    expect(nextStage(2)).toBe(3);
    expect(nextStage(3)).toBeNull();
  });

  it("clamps anything stored to a real stage", () => {
    expect(clampStage(2)).toBe(2);
    expect(clampStage(0)).toBe(1);
    expect(clampStage(9)).toBe(1);
    expect(clampStage("2")).toBe(1);
    expect(clampStage(undefined)).toBe(1);
  });
});
