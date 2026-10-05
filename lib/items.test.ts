import { describe, expect, it } from "vitest";
import { ITEMS, ITEMS_BY_ID, itemsInSet, kanjiNumber } from "./items";

const item = (id: string) => {
  const i = ITEMS_BY_ID.get(id);
  if (!i) throw new Error(`missing ${id}`);
  return i;
};

describe("dataset", () => {
  it("has unique ids", () => {
    expect(ITEMS_BY_ID.size).toBe(ITEMS.length);
  });

  it("has the expected set sizes", () => {
    expect(itemsInSet("ones")).toHaveLength(10);
    expect(itemsInSet("teens-tens")).toHaveLength(89);
    expect(itemsInSet("hundreds")).toHaveLength(9);
    expect(itemsInSet("thousands")).toHaveLength(9);
    expect(itemsInSet("tenthousands")).toHaveLength(9);
    expect(itemsInSet("native")).toHaveLength(10);
    expect(itemsInSet("hours")).toHaveLength(12);
    expect(itemsInSet("minutes")).toHaveLength(10);
    expect(itemsInSet("half")).toHaveLength(1);
    expect(itemsInSet("ampm")).toHaveLength(2);
    expect(itemsInSet("question")).toHaveLength(2);
  });

  it("stores readings in lowercase ASCII", () => {
    for (const i of ITEMS) for (const r of i.readings) expect(r).toMatch(/^[a-z]+$/);
  });
});

describe("numbers", () => {
  it("1–10 with alternates", () => {
    expect(item("ones-1")).toMatchObject({ jp: "一", readings: ["ichi"] });
    expect(item("ones-4").readings).toEqual(["yon", "shi"]);
    expect(item("ones-7").readings).toEqual(["nana", "shichi"]);
    expect(item("ones-9").readings).toEqual(["kyuu", "ku"]);
    expect(item("ones-10")).toMatchObject({ jp: "十", readings: ["juu"] });
  });

  it("composes 11–99", () => {
    expect(item("teens-tens-11")).toMatchObject({ jp: "十一", readings: ["juuichi"] });
    expect(item("teens-tens-20")).toMatchObject({ jp: "二十", readings: ["nijuu"] });
    expect(item("teens-tens-34")).toMatchObject({ jp: "三十四", readings: ["sanjuuyon", "sanjuushi"] });
    expect(item("teens-tens-99")).toMatchObject({ jp: "九十九", readings: ["kyuujuukyuu", "kyuujuuku"] });
  });

  it("hundreds with sound changes", () => {
    expect(item("hundreds-100").readings).toEqual(["hyaku"]);
    expect(item("hundreds-300")).toMatchObject({ jp: "三百", readings: ["sanbyaku"] });
    expect(item("hundreds-600")).toMatchObject({ jp: "六百", readings: ["roppyaku"] });
    expect(item("hundreds-800")).toMatchObject({ jp: "八百", readings: ["happyaku"] });
    expect(item("hundreds-400").readings).toEqual(["yonhyaku"]);
    expect(item("hundreds-600").note).toContain("roppyaku");
  });

  it("thousands with sound changes", () => {
    expect(item("thousands-1000").readings).toEqual(["sen"]);
    expect(item("thousands-3000")).toMatchObject({ jp: "三千", readings: ["sanzen"] });
    expect(item("thousands-8000")).toMatchObject({ jp: "八千", readings: ["hassen"] });
  });

  it("10,000 is ichiman, never bare man", () => {
    expect(item("tenthousands-10000")).toMatchObject({ jp: "一万", readings: ["ichiman"] });
    expect(item("tenthousands-10000").readings).not.toContain("man");
  });

  it("native series", () => {
    expect(itemsInSet("native").map((i) => i.readings[0])).toEqual([
      "hitotsu", "futatsu", "mittsu", "yottsu", "itsutsu", "muttsu", "nanatsu", "yattsu", "kokonotsu", "too",
    ]);
  });

  it("every sound-change item has a note", () => {
    for (const id of ["hundreds-300", "hundreds-600", "hundreds-800", "thousands-3000", "thousands-8000"]) {
      expect(item(id).note).toBeTruthy();
    }
  });
});

describe("time table (verbatim)", () => {
  it("hours", () => {
    expect(itemsInSet("hours").map((i) => [i.jp, i.readings[0]])).toEqual([
      ["一時", "ichiji"], ["二時", "niji"], ["三時", "sanji"], ["四時", "yoji"], ["五時", "goji"], ["六時", "rokuji"],
      ["七時", "shichiji"], ["八時", "hachiji"], ["九時", "kuji"], ["十時", "juuji"], ["十一時", "juuichiji"], ["十二時", "juuniji"],
    ]);
    expect(item("hours-4").readings).not.toContain("yonji");
    expect(item("hours-9").readings).not.toContain("kyuuji");
  });

  it("minutes", () => {
    expect(itemsInSet("minutes").map((i) => [i.jp, i.readings])).toEqual([
      ["一分", ["ippun"]], ["二分", ["nifun"]], ["三分", ["sanpun"]], ["四分", ["yonpun"]], ["五分", ["gofun"]],
      ["六分", ["roppun"]], ["七分", ["nanafun"]], ["八分", ["happun", "hachifun"]], ["九分", ["kyuufun"]],
      ["十分", ["juppun", "jippun"]],
    ]);
  });

  it("modifiers", () => {
    const mods = ITEMS.filter((i) => i.kind === "modifier").map((i) => [i.jp, i.readings[0]]);
    expect(mods).toEqual([["半", "han"], ["午前", "gozen"], ["午後", "gogo"], ["何時", "nanji"], ["何分", "nanpun"]]);
  });
});

describe("kanjiNumber", () => {
  it("writes 1–99", () => {
    expect(kanjiNumber(5)).toBe("五");
    expect(kanjiNumber(10)).toBe("十");
    expect(kanjiNumber(15)).toBe("十五");
    expect(kanjiNumber(20)).toBe("二十");
    expect(kanjiNumber(55)).toBe("五十五");
  });
});
