import { describe, expect, it } from "vitest";
import {
  acceptableReadings, buildNotes, buildNumbers, buildTiles, checkBuild, chunksFor, kanjiFor, readingFor,
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

  it("lets only the ones place use its alternate reading", () => {
    expect(acceptableReadings(304)).toEqual(["sanbyakuyon", "sanbyakushi"]);
    expect(acceptableReadings(740)).toEqual(["nanahyakuyonjuu"]);
  });

  it("rejects out-of-range numbers", () => {
    expect(() => chunksFor(0)).toThrow();
    expect(() => chunksFor(10000)).toThrow();
  });
});

describe("checkBuild", () => {
  it("kanji must match exactly", () => {
    expect(checkBuild(102, "kanji", ["百", "二"])).toBe(true);
    expect(checkBuild(102, "kanji", ["一", "百", "二"])).toBe(false);
    expect(checkBuild(102, "kanji", ["百", "〇", "二"])).toBe(false);
    expect(checkBuild(102, "kanji", [])).toBe(false);
  });

  it("romaji accepts either ones reading and rejects the classic mistakes", () => {
    expect(checkBuild(102, "romaji", ["hyaku", "ni"])).toBe(true);
    expect(checkBuild(304, "romaji", ["sanbyaku", "shi"])).toBe(true);
    expect(checkBuild(600, "romaji", ["roku", "hyaku"])).toBe(false);
    expect(checkBuild(600, "romaji", ["roppyaku"])).toBe(true);
    expect(checkBuild(1000, "romaji", ["ichi", "sen"])).toBe(false);
  });
});

describe("tiles", () => {
  it("always contain the answer and stay within a sensible size", () => {
    for (let s = 0; s < 200; s++) {
      const rng = seeded(s);
      const [n] = buildNumbers(1, 9999, rng);
      for (const mode of ["kanji", "romaji"] as const) {
        const tiles = buildTiles(n!, mode, rng);
        const labels = tiles.map((t) => t.label);
        const pieces = mode === "kanji" ? [...kanjiFor(n!)] : readingFor(n!).split(" ");
        const pool = [...labels];
        for (const p of pieces) {
          const i = pool.indexOf(p);
          expect(i, `${n} ${mode} missing ${p}`).toBeGreaterThanOrEqual(0);
          pool.splice(i, 1);
        }
        expect(tiles.length).toBeLessThanOrEqual(Math.max(9, pieces.length + 3));
        expect(new Set(tiles.map((t) => t.key)).size).toBe(tiles.length);
      }
    }
  });

  it("set the 一 and 〇 traps for 102 in kanji", () => {
    const labels = buildTiles(102, "kanji", seeded(1)).map((t) => t.label);
    expect(labels).toContain("一");
    expect(labels).toContain("〇");
  });

  it("set the 一 trap when the tens digit is 1", () => {
    expect(buildTiles(316, "kanji", seeded(1)).map((t) => t.label)).toContain("一");
  });

  it("set the roku + hyaku trap for 600 in romaji", () => {
    const labels = buildTiles(600, "romaji", seeded(1)).map((t) => t.label);
    expect(labels).toEqual(expect.arrayContaining(["roppyaku", "roku", "hyaku"]));
  });

  it("never offer an alternate reading that would also be correct", () => {
    for (let s = 0; s < 50; s++) {
      expect(buildTiles(304, "romaji", seeded(s)).map((t) => t.label)).not.toContain("shi");
      expect(buildTiles(7, "romaji", seeded(s)).map((t) => t.label)).not.toContain("shichi");
    }
  });
});

describe("rounds and notes", () => {
  it("draws distinct numbers in range", () => {
    const ns = buildNumbers(12, 999, seeded(3));
    expect(ns).toHaveLength(12);
    expect(new Set(ns).size).toBe(12);
    for (const n of ns) {
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(999);
    }
  });

  it("explains zeros, a stray 一 and sound changes", () => {
    expect(buildNotes(102, "kanji", ["百", "〇", "二"]).join(" ")).toContain("nothing for the zero");
    expect(buildNotes(102, "kanji", ["一", "百", "二"]).join(" ")).toContain("no 一 in front");
    expect(buildNotes(101, "kanji", ["一", "百", "一"]).join(" ")).toContain("no 一 in front");
    expect(buildNotes(316, "kanji", ["三", "百", "一", "十", "六"]).join(" ")).toContain("no 一 in front");
    expect(buildNotes(101, "kanji", ["百", "二"]).join(" ")).not.toContain("no 一 in front");
    expect(buildNotes(600, "romaji", ["roku", "hyaku"]).join(" ")).toContain("roppyaku");
    expect(buildNotes(42, "romaji", ["yon"])[0]).toContain("place by place");
  });
});
