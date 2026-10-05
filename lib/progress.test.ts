import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY, accuracy, emptyProgress, loadProgress, parseProgress, recordAnswer, recordRound, saveProgress, recordGrade,
  type StorageLike,
} from "./progress";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const throwingStorage: StorageLike = {
  getItem: () => { throw new Error("SecurityError"); },
  setItem: () => { throw new Error("QuotaExceededError"); },
};

describe("persistence", () => {
  it("round-trips through storage under the versioned key", () => {
    const s = memoryStorage();
    const p = recordRound(recordAnswer(emptyProgress(), "ones-1", true), { score: 150, date: "2026-10-05" });
    expect(saveProgress(p, s)).toBe(true);
    expect(s.data.has(STORAGE_KEY)).toBe(true);
    expect(loadProgress(s)).toEqual(p);
  });

  it("never throws when storage is unavailable", () => {
    expect(loadProgress(throwingStorage)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), throwingStorage)).toBe(false);
    expect(loadProgress(null)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), null)).toBe(false);
  });

  it("falls back to empty on corrupt or foreign data", () => {
    expect(parseProgress("{not json")).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ v: 2, xp: 500 }))).toEqual(emptyProgress());
    expect(parseProgress("null")).toEqual(emptyProgress());
  });

  it("sanitizes bad fields and recomputes level from XP", () => {
    const p = parseProgress(JSON.stringify({
      v: 1, xp: 300, level: 99, bestScore: -5, roundsPlayed: "x",
      items: { a: { attempts: 2, correct: 5 }, b: "bad" },
      days: ["2026-10-05", "2026-10-01", "2026-10-05", "nope"],
    }));
    expect(p.level).toBe(3);
    expect(p.bestScore).toBe(0);
    expect(p.roundsPlayed).toBe(0);
    expect(p.items).toEqual({ a: { attempts: 2, correct: 2 } });
    expect(p.days).toEqual(["2026-10-01", "2026-10-05"]);
  });
});

describe("updates", () => {
  it("counts attempts and correct answers per item", () => {
    let p = emptyProgress();
    p = recordAnswer(p, "x", true);
    p = recordAnswer(p, "x", false);
    p = recordAnswer(p, "x", true);
    expect(p.items.x).toEqual({ attempts: 3, correct: 2 });
    expect(accuracy(p.items.x)).toBeCloseTo(2 / 3);
    expect(accuracy(p.items.y)).toBeNull();
  });

  it("records a round: XP, level, best score, rounds, unique days", () => {
    let p = emptyProgress();
    p = recordRound(p, { score: 120, date: "2026-10-04" });
    p = recordRound(p, { score: 90, date: "2026-10-05" });
    p = recordRound(p, { score: 200, date: "2026-10-05" });
    expect(p).toMatchObject({ xp: 410, level: 3, bestScore: 200, roundsPlayed: 3, days: ["2026-10-04", "2026-10-05"] });
  });

  it("does not mutate its input", () => {
    const p = emptyProgress();
    recordAnswer(p, "x", true);
    recordRound(p, { score: 10, date: "2026-10-05" });
    expect(p).toEqual(emptyProgress());
  });
});

describe("grades", () => {
  it("keeps only the best per mode", () => {
    let p = emptyProgress();
    expect(p.grades).toEqual({});
    p = recordGrade(p, "build", 0.5);
    expect(p.grades.build).toBe(0.5);
    p = recordGrade(p, "build", 0.4);
    expect(p.grades.build).toBe(0.5);
    p = recordGrade(p, "build", 0.9);
    expect(p.grades.build).toBe(0.9);
    expect(recordGrade(p, "recall", 1).grades.recall).toBe(1);
  });

  it("survives a round trip and drops anything odd", () => {
    const s = memoryStorage();
    saveProgress(recordGrade(emptyProgress(), "identify", 0.75), s);
    expect(loadProgress(s).grades.identify).toBe(0.75);
    // Keys are checked by shape so both quizzes can share the store; values must be a ratio.
    expect(parseProgress(JSON.stringify({ v: 1, grades: { "time-say": 0.5 } })).grades).toEqual({ "time-say": 0.5 });
    expect(parseProgress(JSON.stringify({ v: 1, grades: { build: 2, recall: "x", "BAD KEY": 0.5, "": 1 } })).grades).toEqual({});
    expect(parseProgress(JSON.stringify({ v: 1 })).grades).toEqual({});
  });
});
