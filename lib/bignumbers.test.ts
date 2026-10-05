import { describe, expect, it } from "vitest";
import { acceptableReadings, MAX_NUMBER, numberKanji, numberReading, roundNumbers } from "./bignumbers";
import { matchesReading } from "./normalize";

describe("numberKanji", () => {
  it("still spells numbers under 10,000", () => {
    expect(numberKanji(1)).toBe("一");
    expect(numberKanji(102)).toBe("百二");
    expect(numberKanji(3684)).toBe("三千六百八十四");
  });

  it("uses 万 for ten-thousands", () => {
    expect(numberKanji(10_000)).toBe("一万");
    expect(numberKanji(20_000)).toBe("二万");
    expect(numberKanji(120_000)).toBe("十二万");
    expect(numberKanji(3_000_000)).toBe("三百万");
    expect(numberKanji(10_000_000)).toBe("一千万");
    expect(numberKanji(30_000_000)).toBe("三千万");
    expect(numberKanji(12_345)).toBe("一万二千三百四十五");
  });

  it("uses 億 for hundred-millions", () => {
    expect(numberKanji(100_000_000)).toBe("一億");
    expect(numberKanji(300_000_000)).toBe("三億");
    expect(numberKanji(1_000_000_000)).toBe("十億");
    expect(numberKanji(123_456_789)).toBe("一億二千三百四十五万六千七百八十九");
  });

  it("leaves empty groups out", () => {
    expect(numberKanji(100_000_001)).toBe("一億一");
    expect(numberKanji(200_000_000)).toBe("二億");
  });
});

describe("numberReading", () => {
  it("keeps the sound changes of the multiplier", () => {
    expect(numberReading(6_000_000)).toBe("roppyakuman");
    expect(numberReading(80_000_000)).toBe("hassenman");
    expect(numberReading(3_000_000)).toBe("sanbyakuman");
    expect(numberReading(30_000_000)).toBe("sanzenman");
  });

  it("reads 万 and 億", () => {
    expect(numberReading(10_000)).toBe("ichiman");
    expect(numberReading(100_000)).toBe("juuman");
    expect(numberReading(1_000_000)).toBe("hyakuman");
    expect(numberReading(10_000_000)).toBe("issenman");
    expect(numberReading(100_000_000)).toBe("ichioku");
    expect(numberReading(1_000_000_000)).toBe("juuoku");
    expect(numberReading(500_000_000)).toBe("gooku");
  });

  it("joins the groups", () => {
    expect(numberReading(12_345)).toBe("ichiman nisen sanbyaku yonjuu go");
    expect(numberReading(120_000)).toBe("juuniman");
    expect(numberReading(100_000_001)).toBe("ichioku ichi");
  });

  it("never says bare man or oku", () => {
    for (const n of [10_000, 100_000_000]) {
      expect(numberReading(n).startsWith("ichi")).toBe(true);
    }
  });

  it("rejects out-of-range numbers", () => {
    expect(() => numberKanji(0)).toThrow();
    expect(() => numberReading(MAX_NUMBER + 1)).toThrow();
    expect(() => numberKanji(1.5)).toThrow();
  });
});

describe("acceptableReadings", () => {
  it("always includes the primary reading", () => {
    for (const n of [7, 94, 604, 12_345, 10_000, 40_004, 123_456_789, 1_000_000_000]) {
      expect(acceptableReadings(n)).toContain(numberReading(n));
    }
  });

  it("accepts the alternates of 4, 7 and 9 in each group", () => {
    expect(acceptableReadings(4)).toEqual(expect.arrayContaining(["yon", "shi"]));
    expect(acceptableReadings(304)).toEqual(expect.arrayContaining(["sanbyaku yon", "sanbyaku shi"]));
    expect(acceptableReadings(40_004)).toEqual(
      expect.arrayContaining(["yonman yon", "yonman shi", "shiman yon", "shiman shi"]),
    );
  });

  it("matches what a learner would actually type", () => {
    const check = (n: number, typed: string) => matchesReading(typed, acceptableReadings(n));
    expect(check(12_345, "ichiman nisen sanbyaku yonjuu go")).toBe(true);
    expect(check(12_345, "ichimannisensanbyakuyonjuugo")).toBe(true);
    expect(check(12_345, "ICHIMAN NISEN SANBYAKU YONJUU GO")).toBe(true);
    // 四十 is only ever yonjuu, so the alternate of 4 must not leak into the tens.
    expect(check(12_345, "ichiman nisen sanbyaku shijuu go")).toBe(false);
    expect(check(12_344, "ichiman nisen sanbyaku yonjuu shi")).toBe(true);
    expect(check(10_000_000, "issenman")).toBe(true);
    expect(check(1_000_000_000, "juuoku")).toBe(true);
    expect(check(1_000_000_000, "jūoku")).toBe(true);
    expect(check(10_000, "man")).toBe(false);
    expect(check(600, "rokuhyaku")).toBe(false);
  });

  it("stays small", () => {
    expect(acceptableReadings(444_444_444).length).toBeLessThanOrEqual(8);
  });
});

describe("roundNumbers", () => {
  it("is the numbers whose zeros are the lesson", () => {
    const small = roundNumbers(1000);
    expect(small).toContain(10);
    expect(small).toContain(100);
    expect(small).toContain(1000);
    expect(small).toContain(200);
    expect(small.every((n) => n % 10 === 0)).toBe(true);
    expect(Math.max(...small)).toBeLessThanOrEqual(1000);
  });

  it("reaches the big round numbers", () => {
    const big = roundNumbers(MAX_NUMBER);
    for (const n of [10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]) {
      expect(big).toContain(n);
    }
    for (const n of big) expect(() => numberReading(n)).not.toThrow();
  });
});
