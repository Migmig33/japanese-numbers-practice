import { describe, expect, it } from "vitest";
import { ITEMS_BY_ID } from "./items";
import { matchesReading, normalize } from "./normalize";

const readings = (id: string) => ITEMS_BY_ID.get(id)!.readings;

describe("normalize", () => {
  it.each(["KYŪ", "kyuu", "kyu", "Kyū ", "  kyuu  ", "ＫＹＵＵ"])("%j → kyu", (s) => {
    expect(normalize(s)).toBe("kyu");
  });

  it("lowercases, trims and drops internal whitespace", () => {
    expect(normalize("  San  JUU  ")).toBe("sanju");
  });

  it.each([
    ["ū", "u"], ["ō", "o"], ["ā", "a"], ["ē", "e"], ["ī", "i"],
  ])("maps macron %s → %s", (from, to) => {
    expect(normalize(`k${from}`)).toBe(`k${to}`);
  });

  it("collapses doubled vowels", () => {
    expect(normalize("juu")).toBe("ju");
    expect(normalize("kyuu")).toBe("kyu");
    expect(normalize("too")).toBe("to");
  });

  it("strips apostrophes and hyphens", () => {
    expect(normalize("san-juu")).toBe("sanju");
    expect(normalize("han'")).toBe("han");
    expect(normalize("ju’ichiji")).toBe("juichiji");
  });

  it("keeps doubled consonants", () => {
    expect(normalize("roppyaku")).toBe("roppyaku");
    expect(normalize("ippun")).toBe("ippun");
  });
});

describe("matchesReading", () => {
  it("accepts every spelling of 九", () => {
    for (const s of ["KYŪ", "kyuu", "kyu", "Kyū ", "ku"]) expect(matchesReading(s, readings("ones-9"))).toBe(true);
  });

  it("accepts both readings of 七", () => {
    expect(matchesReading("nana", readings("ones-7"))).toBe(true);
    expect(matchesReading("shichi", readings("ones-7"))).toBe(true);
  });

  it("accepts both readings of 四", () => {
    expect(matchesReading("yon", readings("ones-4"))).toBe(true);
    expect(matchesReading("shi", readings("ones-4"))).toBe(true);
  });

  it("accepts juppun and jippun for 十分", () => {
    expect(matchesReading("juppun", readings("minutes-10"))).toBe(true);
    expect(matchesReading("jippun", readings("minutes-10"))).toBe(true);
    expect(matchesReading("juupun", readings("minutes-10"))).toBe(false);
  });

  it("accepts long-vowel variants of とお", () => {
    expect(matchesReading("too", readings("native-10"))).toBe(true);
    expect(matchesReading("tō", readings("native-10"))).toBe(true);
  });

  it("rejects empty and wrong answers", () => {
    expect(matchesReading("", readings("ones-1"))).toBe(false);
    expect(matchesReading("   ", readings("ones-1"))).toBe(false);
    expect(matchesReading("ni", readings("ones-1"))).toBe(false);
  });

  it("rejects the classic time mistakes", () => {
    expect(matchesReading("yonji", readings("hours-4"))).toBe(false);
    expect(matchesReading("kyuuji", readings("hours-9"))).toBe(false);
    expect(matchesReading("rokuhyaku", readings("hundreds-600"))).toBe(false);
  });
});
