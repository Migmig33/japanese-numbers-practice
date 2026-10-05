import { describe, expect, it } from "vitest";
import { ITEMS_BY_ID } from "./items";
import {
  digitalTime, minuteKanji, minuteReading, randomTime, sameTime, timeKana, timeKanji, timeReading,
} from "./time";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("minuteReading", () => {
  it("uses the table verbatim for 1–10", () => {
    const table = ["ippun", "nifun", "sanpun", "yonpun", "gofun", "roppun", "nanafun", "happun", "kyuufun", "juppun"];
    for (let m = 1; m <= 10; m++) {
      expect(minuteReading(m)).toBe(table[m - 1]);
      expect(minuteReading(m)).toBe(ITEMS_BY_ID.get(`minutes-${m}`)!.readings[0]);
    }
  });

  it("keeps the ones digit's form in compounds", () => {
    expect(minuteReading(11)).toBe("juuippun");
    expect(minuteReading(15)).toBe("juugofun");
    expect(minuteReading(21)).toBe("nijuuippun");
    expect(minuteReading(25)).toBe("nijuugofun");
    expect(minuteReading(29)).toBe("nijuukyuufun");
    expect(minuteReading(36)).toBe("sanjuuroppun");
    expect(minuteReading(48)).toBe("yonjuuhappun");
    expect(minuteReading(59)).toBe("gojuukyuufun");
  });

  it("uses juppun for whole tens", () => {
    expect(minuteReading(20)).toBe("nijuppun");
    expect(minuteReading(30)).toBe("sanjuppun");
    expect(minuteReading(40)).toBe("yonjuppun");
    expect(minuteReading(50)).toBe("gojuppun");
  });

  it("rejects out-of-range minutes", () => {
    expect(() => minuteReading(0)).toThrow();
    expect(() => minuteReading(60)).toThrow();
    expect(() => minuteReading(1.5)).toThrow();
  });
});

describe("minuteKanji", () => {
  it("writes the number then 分", () => {
    expect(minuteKanji(1)).toBe("一分");
    expect(minuteKanji(10)).toBe("十分");
    expect(minuteKanji(29)).toBe("二十九分");
    expect(minuteKanji(45)).toBe("四十五分");
  });
});

describe("whole times", () => {
  it("writes and reads o'clock", () => {
    expect(timeKanji({ hour: 4, minute: 0 })).toBe("四時");
    expect(timeReading({ hour: 4, minute: 0 })).toBe("yoji");
    expect(timeReading({ hour: 9, minute: 0 })).toBe("kuji");
    expect(timeReading({ hour: 7, minute: 0 })).toBe("shichiji");
  });

  it("prefers 半 for half past", () => {
    expect(timeKanji({ hour: 3, minute: 30 })).toBe("三時半");
    expect(timeReading({ hour: 3, minute: 30 })).toBe("sanji han");
    expect(timeKanji({ hour: 3, minute: 30 }, { han: false })).toBe("三時三十分");
    expect(timeReading({ hour: 3, minute: 30 }, { han: false })).toBe("sanji sanjuppun");
  });

  it("writes and reads any minute", () => {
    expect(timeKanji({ hour: 1, minute: 29 })).toBe("一時二十九分");
    expect(timeReading({ hour: 1, minute: 29 })).toBe("ichiji nijuukyuufun");
    expect(timeKanji({ hour: 12, minute: 5 })).toBe("十二時五分");
    expect(timeReading({ hour: 12, minute: 5 })).toBe("juuniji gofun");
  });

  it("formats the digital time", () => {
    expect(digitalTime({ hour: 1, minute: 29 })).toBe("1:29");
    expect(digitalTime({ hour: 12, minute: 0 })).toBe("12:00");
    expect(digitalTime({ hour: 9, minute: 5 })).toBe("9:05");
  });

  it("rejects out-of-range times", () => {
    expect(() => timeKanji({ hour: 0, minute: 0 })).toThrow();
    expect(() => timeKanji({ hour: 13, minute: 0 })).toThrow();
    expect(() => timeReading({ hour: 1, minute: 60 })).toThrow();
  });
});

describe("randomTime", () => {
  it("stays in range, never repeats the previous time, and can reach any minute", () => {
    const rng = seeded(5);
    const minutes = new Set<number>();
    let prev: ReturnType<typeof randomTime> | undefined;
    for (let i = 0; i < 400; i++) {
      const t = randomTime(rng, prev);
      expect(t.hour).toBeGreaterThanOrEqual(1);
      expect(t.hour).toBeLessThanOrEqual(12);
      expect(t.minute).toBeGreaterThanOrEqual(0);
      expect(t.minute).toBeLessThanOrEqual(59);
      if (prev) expect(sameTime(prev, t)).toBe(false);
      minutes.add(t.minute);
      prev = t;
      // Every generated time must be speakable.
      expect(() => timeReading(t)).not.toThrow();
    }
    expect(minutes.has(0)).toBe(true);
    expect(minutes.has(30)).toBe(true);
    expect([...minutes].some((m) => m % 5 !== 0)).toBe(true);
  });
});

describe("timeKana", () => {
  it("writes the time in hiragana", () => {
    expect(timeKana({ hour: 4, minute: 0 })).toBe("よじ");
    expect(timeKana({ hour: 9, minute: 0 })).toBe("くじ");
    expect(timeKana({ hour: 3, minute: 30 })).toBe("さんじ はん");
    expect(timeKana({ hour: 1, minute: 29 })).toBe("いちじ にじゅうきゅうふん");
    expect(timeKana({ hour: 12, minute: 5 })).toBe("じゅうにじ ごふん");
  });

  it("matches the romaji word for word, for every time", () => {
    for (let h = 1; h <= 12; h++) {
      for (let m = 0; m <= 59; m++) {
        const kana = timeKana({ hour: h, minute: m });
        expect(kana.split(" "), `${h}:${m}`).toHaveLength(timeReading({ hour: h, minute: m }).split(" ").length);
        expect(kana, `${h}:${m}`).toMatch(/^[ぁ-ゟ ]+$/);
      }
    }
  });
});
