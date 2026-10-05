import { describe, expect, it } from "vitest";
import {
  ALL_KANA, AMBIGUOUS, BASIC, BASIC_ROWS, buildKanaRound, checkKanaAnswer, COMBO, DAKUTEN, HIRAGANA_MODE_IDS,
  HIRAGANA_MODES, COMBO_ROWS, COMBO_VOWELS, kanaOptions, kanaPool, quizzable, rowOf, type KanaQuestion,
} from "./hiragana";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("the chart", () => {
  it("has the right number of characters in each group", () => {
    expect(BASIC).toHaveLength(46);
    expect(DAKUTEN).toHaveLength(25);
    expect(COMBO).toHaveLength(33);
    expect(ALL_KANA).toHaveLength(104);
  });

  it("has no duplicate characters", () => {
    expect(new Set(ALL_KANA.map((x) => x.kana)).size).toBe(ALL_KANA.length);
  });

  it("is written in real hiragana, with romaji in plain letters", () => {
    for (const x of ALL_KANA) {
      expect(x.kana, x.romaji).toMatch(/^[ぁ-ゟ]{1,2}$/);
      expect(x.romaji, x.kana).toMatch(/^[a-z]{1,3}$/);
    }
  });

  it("uses Hepburn for the sounds that are not spelled as written", () => {
    const find = (kana: string) => ALL_KANA.find((x) => x.kana === kana)!;
    expect(find("し").romaji).toBe("shi");
    expect(find("ち").romaji).toBe("chi");
    expect(find("つ").romaji).toBe("tsu");
    expect(find("ふ").romaji).toBe("fu");
    expect(find("じ").romaji).toBe("ji");
    expect(find("しゃ").romaji).toBe("sha");
    expect(find("ちゃ").romaji).toBe("cha");
    expect(find("じゃ").romaji).toBe("ja");
    expect(find("ん").romaji).toBe("n");
    expect(find("を").romaji).toBe("wo");
  });

  it("lays out five to a row, with gaps where the chart has gaps", () => {
    expect(rowOf(BASIC, "k").map((x) => (x ? x.kana : null))).toEqual(["か", "き", "く", "け", "こ"]);
    // や行 and わ行 are famously incomplete.
    expect(rowOf(BASIC, "y").map((x) => (x ? x.kana : null))).toEqual(["や", null, "ゆ", null, "よ"]);
    expect(rowOf(BASIC, "w").map((x) => (x ? x.kana : null))).toEqual(["わ", null, null, null, "を"]);
  });

  it("warns about the look-alikes", () => {
    for (const kana of ["あ", "お", "ぬ", "め", "る", "ろ", "わ", "ね", "つ", "う"]) {
      expect(ALL_KANA.find((x) => x.kana === kana)!.note, kana).toBeTruthy();
    }
  });
});

describe("ぢ and づ", () => {
  it("are in the chart but never in a round", () => {
    expect(ALL_KANA.map((x) => x.kana)).toEqual(expect.arrayContaining(["ぢ", "づ"]));
    expect([...AMBIGUOUS]).toEqual(["ぢ", "づ"]);
    expect(quizzable(ALL_KANA.find((x) => x.kana === "ぢ")!)).toBe(false);
    expect(kanaPool(["basic", "dakuten", "combo"]).map((x) => x.kana)).not.toContain("ぢ");
    expect(kanaPool(["basic", "dakuten", "combo"]).map((x) => x.kana)).not.toContain("づ");
  });

  it("means no sound in the pool has two characters", () => {
    const pool = kanaPool(["basic", "dakuten", "combo"]);
    const byRomaji = new Map<string, string[]>();
    for (const x of pool) byRomaji.set(x.romaji, [...(byRomaji.get(x.romaji) ?? []), x.kana]);
    for (const [romaji, kana] of byRomaji) expect(kana, `${romaji} maps to ${kana.join(" and ")}`).toHaveLength(1);
  });
});

describe("options", () => {
  it("always gives four distinct choices including the right one", () => {
    const pool = kanaPool(["basic", "dakuten", "combo"]);
    for (const mode of ["kana-read", "kana-find"] as const) {
      for (const item of pool) {
        const opts = kanaOptions(item, pool, mode, seeded(item.kana.charCodeAt(0)));
        expect(opts, item.kana).toHaveLength(4);
        expect(new Set(opts).size, item.kana).toBe(4);
        expect(opts, item.kana).toContain(mode === "kana-find" ? item.kana : item.romaji);
      }
    }
  });

  it("prefers the same row, so the question is about the vowel", () => {
    const pool = kanaPool(["basic"]);
    const ka = pool.find((x) => x.kana === "か")!;
    const opts = kanaOptions(ka, pool, "kana-read", seeded(3));
    const wrong = opts.filter((o) => o !== "ka");
    expect(wrong.some((o) => ["ki", "ku", "ke", "ko"].includes(o))).toBe(true);
  });
});

describe("rounds", () => {
  it("fills a round from the chosen sets, without repeats", () => {
    for (const mode of HIRAGANA_MODE_IDS) {
      const round = buildKanaRound(mode, { sets: ["basic"] }, seeded(1));
      expect(round).toHaveLength(12);
      expect(new Set(round.map((q) => q.id)).size).toBe(12);
      for (const q of round) expect(q.item.group).toBe("basic");
    }
  });

  it("only gives options to the picking modes", () => {
    expect(buildKanaRound("kana-read", {}, seeded(1)).every((q) => q.options?.length === 4)).toBe(true);
    expect(buildKanaRound("kana-find", {}, seeded(1)).every((q) => q.options?.length === 4)).toBe(true);
    expect(buildKanaRound("kana-type", {}, seeded(1)).every((q) => q.options === undefined)).toBe(true);
  });

  it("can mix in the dakuten and combination sets", () => {
    const round = buildKanaRound("kana-read", { sets: ["combo"] }, seeded(5));
    expect(round.every((q) => q.item.group === "combo")).toBe(true);
  });

  it("labels the modes Easy, Medium and Hard", () => {
    expect(HIRAGANA_MODE_IDS.map((id) => HIRAGANA_MODES[id].difficulty)).toEqual(["Easy", "Medium", "Hard"]);
  });
});

describe("marking", () => {
  const shi = ALL_KANA.find((x) => x.kana === "し")!;
  const wo = ALL_KANA.find((x) => x.kana === "を")!;

  it("marks a picked sound and a picked character", () => {
    const q: KanaQuestion = { id: "x", item: shi, options: ["shi", "sa", "su", "so"] };
    expect(checkKanaAnswer(q, "kana-read", "shi")).toBe(true);
    expect(checkKanaAnswer(q, "kana-read", "si")).toBe(false);
    expect(checkKanaAnswer({ id: "x", item: shi }, "kana-find", "し")).toBe(true);
    expect(checkKanaAnswer({ id: "x", item: shi }, "kana-find", "さ")).toBe(false);
  });

  it("forgives case and spacing when typing, and takes を as o", () => {
    const q: KanaQuestion = { id: "x", item: shi };
    expect(checkKanaAnswer(q, "kana-type", " SHI ")).toBe(true);
    expect(checkKanaAnswer(q, "kana-type", "")).toBe(false);
    expect(checkKanaAnswer(q, "kana-type", null)).toBe(false);
    const w: KanaQuestion = { id: "y", item: wo };
    expect(checkKanaAnswer(w, "kana-type", "wo")).toBe(true);
    expect(checkKanaAnswer(w, "kana-type", "o")).toBe(true);
  });
});

describe("the combination grid", () => {
  it("has three columns, not five", () => {
    expect(rowOf(COMBO, "k", COMBO_VOWELS).map((x) => (x ? x.kana : null))).toEqual(["きゃ", "きゅ", "きょ"]);
    expect(rowOf(COMBO, "s", COMBO_VOWELS).map((x) => (x ? x.romaji : null))).toEqual(["sha", "shu", "sho"]);
  });

  it("fills every cell of every combination row", () => {
    for (const row of COMBO_ROWS) {
      expect(rowOf(COMBO, row, COMBO_VOWELS).filter(Boolean), row).toHaveLength(3);
    }
  });
});

describe("ん", () => {
  it("is in the basic set but belongs to no vowel column", () => {
    const n = BASIC.find((x) => x.kana === "ん")!;
    expect(n.romaji).toBe("n");
    expect(n.vowel).toBe("-");
    // Which is why the grid alone cannot show all 46.
    const inGrid = BASIC_ROWS.flatMap((r) => rowOf(BASIC, r)).filter(Boolean);
    expect(inGrid).toHaveLength(BASIC.length - 1);
  });

  it("is still quizzed", () => {
    expect(kanaPool(["basic"]).map((x) => x.kana)).toContain("ん");
  });
});
