import { describe, expect, it } from "vitest";
import { numberKanji, numberReading } from "./bignumbers";
import {
  buildModeRound, checkAnswer, gradeFor, isModeId, MODE_IDS, MODES, modeNumbers, numberOptions,
  ROUND_NUMBERS_PER_ROUND, type Question,
} from "./modes";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const isRound = (n: number) => n >= 10 && n % 10 === 0;

describe("mode rounds", () => {
  it("includes three zero-heavy numbers every time", () => {
    for (const mode of ["identify", "recall"] as const) {
      for (let s = 0; s < 40; s++) {
        const ns = modeNumbers(mode, 12, seeded(s));
        expect(ns).toHaveLength(12);
        expect(new Set(ns).size).toBe(12);
        expect(ns.filter(isRound).length).toBeGreaterThanOrEqual(ROUND_NUMBERS_PER_ROUND);
      }
    }
  });

  it("stays inside each stage's ceiling and is always speakable", () => {
    for (const mode of ["identify", "recall"] as const) {
      for (let s = 0; s < 20; s++) {
        for (const n of modeNumbers(mode, 12, seeded(s))) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(MODES[mode].max);
          expect(() => numberReading(n)).not.toThrow();
        }
      }
    }
  });

  it("reaches 万 in Read it and 億 in Say it", () => {
    expect(MODES.identify.max).toBe(9_999_999);
    expect(MODES.recall.max).toBe(1_000_000_000);
  });
});

describe("buildModeRound", () => {
  it("Build it keeps the place-by-place chooser", () => {
    const round = buildModeRound("build", {}, seeded(1));
    expect(round).toHaveLength(12);
    expect(round.every((q) => q.kind === "build")).toBe(true);
  });

  it("every mode's round carries its share of zero-heavy numbers", () => {
    for (const mode of MODE_IDS) {
      for (let s = 0; s < 25; s++) {
        const round = buildModeRound(mode, {}, seeded(s));
        const numbers = round.map((q) =>
          q.kind === "build" ? Number(q.prompt.replace(/,/g, "")) : q.n,
        );
        const rounded = numbers.filter((n) => Number.isFinite(n) && n >= 10 && n % 10 === 0);
        expect(rounded.length, `${mode} seed ${s}`).toBeGreaterThanOrEqual(ROUND_NUMBERS_PER_ROUND);
      }
    }
  });

  it("still mixes in the native words when asked", () => {
    const round = buildModeRound("build", { native: true }, seeded(4));
    expect(round.filter((q) => q.id.startsWith("native-")).length).toBeGreaterThan(0);
    expect(round).toHaveLength(12);
  });

  it("Read it asks for the number, with the answer among the options", () => {
    const round = buildModeRound("identify", {}, seeded(2));
    expect(round.every((q) => q.kind === "identify")).toBe(true);
    for (const q of round) {
      if (q.kind !== "identify") continue;
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.n);
      expect(new Set(q.options).size).toBe(4);
      expect(q.kanji).toBe(numberKanji(q.n));
    }
  });

  it("Say it asks for the reading with no options", () => {
    const round = buildModeRound("recall", {}, seeded(3));
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

describe("grading", () => {
  it("runs from A+ down to E", () => {
    expect(gradeFor(1).letter).toBe("A+");
    expect(gradeFor(0.95).letter).toBe("A+");
    expect(gradeFor(0.9).letter).toBe("A");
    expect(gradeFor(0.83).letter).toBe("B");
    expect(gradeFor(0.7).letter).toBe("C");
    expect(gradeFor(0.6).letter).toBe("D");
    expect(gradeFor(0).letter).toBe("E");
  });

  it("always has something to say", () => {
    for (let a = 0; a <= 1.0001; a += 0.05) {
      const g = gradeFor(Math.min(a, 1));
      expect(g.letter).toBeTruthy();
      expect(g.label).toBeTruthy();
    }
  });

  it("knows which mode keys are real", () => {
    for (const id of MODE_IDS) expect(isModeId(id)).toBe(true);
    for (const bad of ["nope", 1, null, undefined]) expect(isModeId(bad)).toBe(false);
  });
});
