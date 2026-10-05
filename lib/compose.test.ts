import { describe, expect, it } from "vitest";
import {
  answerKanji, answerReading, buildNumbers, buildQuestions, checkChoice, choiceNotes, chunksFor, kanjiFor,
  nativeQuestion, numberQuestion, OPTION_COUNT, readingFor,
} from "./compose";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("chunks", () => {
  it("spells numbers place by place from dataset items", () => {
    expect(chunksFor(102).map((c) => c.id)).toEqual(["hundreds-100", "ones-2"]);
    expect(chunksFor(3684).map((c) => c.id)).toEqual(["thousands-3000", "hundreds-600", "teens-tens-80", "ones-4"]);
    expect(chunksFor(110).map((c) => c.id)).toEqual(["hundreds-100", "ones-10"]);
    expect(chunksFor(1000).map((c) => c.id)).toEqual(["thousands-1000"]);
  });

  it("writes kanji", () => {
    expect(kanjiFor(102)).toBe("百二");
    expect(kanjiFor(3684)).toBe("三千六百八十四");
    expect(kanjiFor(1010)).toBe("千十");
    expect(kanjiFor(12)).toBe("十二");
    expect(kanjiFor(8000)).toBe("八千");
  });

  it("reads with the sound changes from the dataset", () => {
    expect(readingFor(102)).toBe("hyaku ni");
    expect(readingFor(3684)).toBe("sanzen roppyaku hachijuu yon");
    expect(readingFor(8300)).toBe("hassen sanbyaku");
  });

  it("rejects out-of-range numbers", () => {
    expect(() => chunksFor(0)).toThrow();
    expect(() => chunksFor(10000)).toThrow();
  });
});

describe("multiple choice", () => {
  it("makes one step per non-zero place, in order", () => {
    expect(numberQuestion(100, seeded(1)).steps.map((s) => s.answer.jp)).toEqual(["百"]);
    expect(numberQuestion(102, seeded(1)).steps.map((s) => s.answer.jp)).toEqual(["百", "二"]);
    expect(numberQuestion(3684, seeded(1)).steps.map((s) => s.answer.jp)).toEqual(["三千", "六百", "八十", "四"]);
  });

  it("always offers exactly four distinct options including the answer", () => {
    for (let s = 0; s < 150; s++) {
      const rng = seeded(s);
      const [n] = buildNumbers(1, 9999, rng, 1);
      const q = numberQuestion(n!, rng);
      for (const step of q.steps) {
        expect(step.options).toHaveLength(OPTION_COUNT);
        expect(new Set(step.options.map((o) => o.id)).size).toBe(OPTION_COUNT);
        expect(step.options.map((o) => o.id)).toContain(step.answer.id);
      }
    }
  });

  it("draws each place's options from that same place", () => {
    const q = numberQuestion(3684, seeded(7));
    expect(q.steps[0]!.options.every((o) => o.set === "thousands")).toBe(true);
    expect(q.steps[1]!.options.every((o) => o.set === "hundreds")).toBe(true);
    expect(q.steps[2]!.options.every((o) => o.set === "teens-tens" || o.id === "ones-10")).toBe(true);
    expect(q.steps[3]!.options.every((o) => o.set === "ones")).toBe(true);
  });

  it("reads the assembled answer back", () => {
    const q = numberQuestion(3684, seeded(1));
    expect(answerKanji(q)).toBe("三千六百八十四");
    expect(answerReading(q)).toBe("sanzen roppyaku hachijuu yon");
  });

  it("checks the picks in order", () => {
    const q = numberQuestion(102, seeded(1));
    const [hyaku, ni] = q.steps.map((s) => s.answer);
    expect(checkChoice(q, [hyaku!, ni!])).toBe(true);
    expect(checkChoice(q, [ni!, hyaku!])).toBe(false);
    expect(checkChoice(q, [hyaku!])).toBe(false);
    expect(checkChoice(q, [])).toBe(false);
  });

  it("names the first wrong place and the rule behind it", () => {
    const q = numberQuestion(600, seeded(1));
    const wrong = q.steps[0]!.options.find((o) => o.id !== "hundreds-600")!;
    const notes = choiceNotes(q, [wrong]).join(" ");
    expect(notes).toContain("六百");
    expect(notes).toContain("roppyaku");

    const q2 = numberQuestion(316, seeded(2));
    const notes2 = choiceNotes(q2, [q2.steps[0]!.answer]).join(" ");
    expect(notes2).toContain("Place 2 of 3");
  });

  it("starts a single-place note with a capital", () => {
    const q = nativeQuestion(10, seeded(1));
    expect(choiceNotes(q, [])[0]).toMatch(/^Nothing chosen here/);
    expect(numberQuestion(100, seeded(1)).unit).toBe("kanji");
  });

  it("offers native counting words as a single choice", () => {
    const q = nativeQuestion(4, seeded(1));
    expect(q.prompt).toBe("4");
    expect(q.hint).toBe("counting things");
    expect(q.steps).toHaveLength(1);
    expect(q.unit).toBe("word");
    expect(q.steps[0]!.answer.jp).toBe("よっつ");
    expect(q.steps[0]!.options.every((o) => o.set === "native")).toBe(true);
  });

  it("builds a round, optionally mixing in native words", () => {
    const plain = buildQuestions(12, { max: 999 }, seeded(4));
    expect(plain).toHaveLength(12);
    expect(new Set(plain.map((q) => q.id)).size).toBe(12);
    expect(plain.every((q) => q.id.startsWith("n-"))).toBe(true);

    const mixed = buildQuestions(12, { max: 999, native: true }, seeded(4));
    expect(mixed).toHaveLength(12);
    expect(mixed.filter((q) => q.id.startsWith("native-"))).toHaveLength(3);
  });
});

describe("rounds", () => {
  it("draws distinct numbers in range", () => {
    const ns = buildNumbers(12, 999, seeded(3));
    expect(ns).toHaveLength(12);
    expect(new Set(ns).size).toBe(12);
    for (const n of ns) {
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(999);
    }
  });
});
