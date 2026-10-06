import { describe, expect, it } from "vitest";
import { BASIC } from "./hiragana";
import { ITEMS_BY_ID } from "./items";
import { KANA_GUIDES, KANJI_GUIDES, kanaTrace, kanjiTrace } from "./strokes";

// Standard stroke counts.
const COUNTS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 5, 五: 4, 六: 4, 七: 2, 八: 2, 九: 2, 十: 2, 百: 6, 千: 3, 万: 3,
};

/** As taught in Japanese primary school; see the note on KanaGuide for the joined forms. */
const KANA_COUNTS: Record<string, number> = {
  あ: 3, い: 2, う: 2, え: 2, お: 3,
  か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1,
  た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1,
  は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3,
  や: 3, ゆ: 2, よ: 2,
  ら: 2, り: 2, る: 1, れ: 2, ろ: 1,
  わ: 2, を: 3, ん: 1,
};

const inBox = (x: number, y: number) => {
  expect(x).toBeGreaterThanOrEqual(0);
  expect(x).toBeLessThanOrEqual(100);
  expect(y).toBeGreaterThanOrEqual(0);
  expect(y).toBeLessThanOrEqual(100);
};

describe("kanji guides", () => {
  it.each(KANJI_GUIDES.map((g) => [g.char, g] as const))("%s has the right stroke count", (char, g) => {
    expect(g.strokes).toHaveLength(COUNTS[char]!);
  });

  it("keeps every point inside the box", () => {
    for (const g of KANJI_GUIDES)
      for (const s of g.strokes) {
        expect(s.length).toBeGreaterThanOrEqual(2);
        for (const [x, y] of s) inBox(x, y);
      }
  });

  it("uses the dataset's primary reading", () => {
    // 万 is deliberately absent: the dataset's 10,000 is 一万 ichiman, because bare 万 is
    // never a number on its own. The character still has its own reading, man.
    for (const g of KANJI_GUIDES.filter((x) => x.char !== "万")) {
      const id = g.value <= 10 ? `ones-${g.value}` : g.value === 100 ? "hundreds-100" : "thousands-1000";
      expect(ITEMS_BY_ID.get(id)!.readings[0]).toBe(g.reading);
      expect(ITEMS_BY_ID.get(id)!.jp).toBe(g.char);
    }
  });

  it("covers every composing character up to 万", () => {
    for (const char of ["十", "百", "千", "万"]) {
      expect(KANJI_GUIDES.map((g) => g.char)).toContain(char);
    }
  });

  it("warns that 万 is never said bare", () => {
    expect(KANJI_GUIDES.find((g) => g.char === "万")!.note).toMatch(/ichiman/);
  });
});

describe("kana guides", () => {
  it("covers all 46 basic hiragana, in chart order", () => {
    expect(KANA_GUIDES.map((g) => g.char)).toEqual(BASIC.map((k) => k.kana));
  });

  it("has no duplicates", () => {
    expect(new Set(KANA_GUIDES.map((g) => g.char)).size).toBe(KANA_GUIDES.length);
  });

  it.each(KANA_GUIDES.map((g) => [g.char, g] as const))("%s has the taught stroke count", (char, g) => {
    expect(g.starts).toHaveLength(KANA_COUNTS[char]!);
  });

  it("matches the hiragana dataset's romaji", () => {
    const romaji = new Map(BASIC.map((k) => [k.kana, k.romaji]));
    for (const g of KANA_GUIDES) expect(g.reading).toBe(romaji.get(g.char));
  });

  it("keeps every stroke start inside the box", () => {
    for (const g of KANA_GUIDES) for (const [x, y] of g.starts) inBox(x, y);
  });
});

describe("trace guides", () => {
  it("gives kanji a polyline ghost, starting at each stroke's first point", () => {
    const t = kanjiTrace(KANJI_GUIDES.find((g) => g.char === "四")!);
    expect(t.strokes).toBeDefined();
    expect(t.starts).toHaveLength(5);
    expect(t.starts[0]).toEqual(KANJI_GUIDES.find((g) => g.char === "四")!.strokes[0]![0]);
  });

  it("gives kana no ghost paths, so the pad draws the real glyph", () => {
    const t = kanaTrace(KANA_GUIDES.find((g) => g.char === "あ")!);
    expect(t.strokes).toBeUndefined();
    expect(t.starts).toHaveLength(3);
  });

  it("never reports a stroke count of zero", () => {
    for (const t of [...KANJI_GUIDES.map(kanjiTrace), ...KANA_GUIDES.map(kanaTrace)]) {
      expect(t.starts.length).toBeGreaterThan(0);
    }
  });
});

describe("trace guide kana", () => {
  it("reads each kanji from the dataset, so the sound is never guessed", () => {
    const byChar = new Map(KANJI_GUIDES.map((k) => [k.char, kanjiTrace(k).kana]));
    expect(byChar.get("一")).toBe("いち");
    expect(byChar.get("四")).toBe("よん");
    expect(byChar.get("七")).toBe("なな");
    expect(byChar.get("百")).toBe("ひゃく");
  });

  it("gives 万 its own kana, since a bare 万 is never a number", () => {
    const man = KANJI_GUIDES.find((k) => k.char === "万")!;
    expect(kanjiTrace(man).kana).toBe("まん");
  });

  it("gives every kanji guide a non-empty kana", () => {
    for (const k of KANJI_GUIDES) expect(kanjiTrace(k).kana.length).toBeGreaterThan(0);
  });

  it("uses the character itself for kana guides", () => {
    for (const k of KANA_GUIDES) expect(kanaTrace(k).kana).toBe(k.char);
  });
});
