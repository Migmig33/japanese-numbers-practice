import { describe, expect, it } from "vitest";
import {
  buildTimeRound, checkTimeAnswer, questionDigital, questionKanji, questionReading, timeOptions,
  TIME_MODE_IDS, TIME_MODES, type TimeQuestion,
} from "./timequiz";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("question text", () => {
  it("keeps the irregular hours", () => {
    expect(questionKanji({ hour: 4, minute: 0 })).toBe("四時");
    expect(questionReading({ hour: 4, minute: 0 })).toBe("yoji");
    expect(questionReading({ hour: 9, minute: 0 })).toBe("kuji");
    expect(questionReading({ hour: 7, minute: 0 })).toBe("shichiji");
  });

  it("puts 午前 and 午後 in front, as Japanese does", () => {
    expect(questionKanji({ hour: 3, minute: 0 }, "gogo")).toBe("午後三時");
    expect(questionReading({ hour: 3, minute: 0 }, "gogo")).toBe("gogo sanji");
    expect(questionKanji({ hour: 8, minute: 30 }, "gozen")).toBe("午前八時半");
    expect(questionReading({ hour: 8, minute: 30 }, "gozen")).toBe("gozen hachiji han");
  });

  it("writes the clock time plainly", () => {
    expect(questionDigital({ hour: 1, minute: 29 })).toBe("1:29");
    expect(questionDigital({ hour: 3, minute: 5 }, "gogo")).toBe("3:05 p.m.");
    expect(questionDigital({ hour: 11, minute: 0 }, "gozen")).toBe("11:00 a.m.");
  });
});

describe("timeOptions", () => {
  it("offers four distinct times including the right one", () => {
    for (const time of [{ hour: 4, minute: 0 }, { hour: 1, minute: 29 }, { hour: 12, minute: 30 }]) {
      for (let s = 0; s < 20; s++) {
        const opts = timeOptions(time, undefined, seeded(s));
        expect(opts).toHaveLength(4);
        expect(opts).toContain(questionDigital(time));
        expect(new Set(opts).size).toBe(4);
      }
    }
  });

  it("includes the neighbouring hour, which is the real confusion", () => {
    const opts = timeOptions({ hour: 4, minute: 0 }, undefined, seeded(1), 8);
    expect(opts.some((o) => o === "3:00" || o === "5:00")).toBe(true);
  });

  it("offers the other half of the day when a period is asked for", () => {
    const opts = timeOptions({ hour: 3, minute: 0 }, "gogo", seeded(1), 8);
    expect(opts).toContain("3:00 p.m.");
    expect(opts.some((o) => o.endsWith("a.m."))).toBe(true);
  });
});

describe("rounds", () => {
  it("builds a full, non-repeating round for every mode", () => {
    for (const mode of TIME_MODE_IDS) {
      for (let s = 0; s < 20; s++) {
        const round = buildTimeRound(mode, {}, seeded(s));
        expect(round).toHaveLength(12);
        expect(new Set(round.map((q) => q.id)).size).toBe(12);
        for (const q of round) {
          expect(q.time.hour).toBeGreaterThanOrEqual(1);
          expect(q.time.hour).toBeLessThanOrEqual(12);
          expect(q.time.minute).toBeGreaterThanOrEqual(0);
          expect(q.time.minute).toBeLessThanOrEqual(59);
          expect(q.reading).toBe(questionReading(q.time, q.period));
        }
      }
    }
  });

  it("only gives options in the picking mode", () => {
    expect(buildTimeRound("time-read", {}, seeded(1)).every((q) => q.options?.length === 4)).toBe(true);
    expect(buildTimeRound("time-set", {}, seeded(1)).every((q) => q.options === undefined)).toBe(true);
    expect(buildTimeRound("time-say", {}, seeded(1)).every((q) => q.options === undefined)).toBe(true);
  });

  it("never asks a clock face for a.m. or p.m.", () => {
    const round = buildTimeRound("time-set", { periods: true }, seeded(2));
    expect(round.every((q) => q.period === undefined)).toBe(true);
    const spoken = buildTimeRound("time-say", { periods: true }, seeded(2));
    expect(spoken.some((q) => q.period !== undefined)).toBe(true);
  });

  it("labels every mode with a difficulty", () => {
    expect(TIME_MODE_IDS.map((id) => TIME_MODES[id].difficulty)).toEqual(["Easy", "Medium", "Hard"]);
  });
});

describe("checkTimeAnswer", () => {
  const q: TimeQuestion = {
    id: "x", time: { hour: 4, minute: 0 }, kanji: "四時", reading: "yoji", digital: "4:00",
    options: ["3:00", "4:00", "5:00", "9:00"],
  };

  it("marks a picked time", () => {
    expect(checkTimeAnswer(q, "time-read", "4:00")).toBe(true);
    expect(checkTimeAnswer(q, "time-read", "5:00")).toBe(false);
    expect(checkTimeAnswer(q, "time-read", null)).toBe(false);
  });

  it("marks the hands on the clock", () => {
    expect(checkTimeAnswer(q, "time-set", { hour: 4, minute: 0 })).toBe(true);
    expect(checkTimeAnswer(q, "time-set", { hour: 4, minute: 1 })).toBe(false);
    expect(checkTimeAnswer(q, "time-set", { hour: 5, minute: 0 })).toBe(false);
  });

  it("marks the typed reading, and refuses the classic mistake", () => {
    expect(checkTimeAnswer(q, "time-say", "yoji")).toBe(true);
    expect(checkTimeAnswer(q, "time-say", " YOJI ")).toBe(true);
    expect(checkTimeAnswer(q, "time-say", "yonji")).toBe(false);
    expect(checkTimeAnswer(q, "time-say", "")).toBe(false);
    const nine: TimeQuestion = { ...q, time: { hour: 9, minute: 0 }, kanji: "九時", reading: "kuji", digital: "9:00" };
    expect(checkTimeAnswer(nine, "time-say", "kuji")).toBe(true);
    expect(checkTimeAnswer(nine, "time-say", "kyuuji")).toBe(false);
  });
});
