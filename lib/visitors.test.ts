import { describe, expect, it } from "vitest";
import {
  LAST_COUNTED_KEY, markCounted, parseCount, shouldCount, utcDate, VISITOR_ID_KEY, visitorId,
  type VisitorStorage,
} from "./visitors";

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

const throwing: VisitorStorage = {
  getItem: () => { throw new Error("SecurityError"); },
  setItem: () => { throw new Error("SecurityError"); },
};

describe("utcDate", () => {
  it("is the UTC calendar day", () => {
    expect(utcDate(new Date("2026-10-05T23:59:59Z"))).toBe("2026-10-05");
    expect(utcDate(new Date("2026-10-06T00:00:00Z"))).toBe("2026-10-06");
  });
});

describe("visitorId", () => {
  it("creates one id and then reuses it", () => {
    const s = memoryStorage();
    const first = visitorId(s);
    expect(first).toBeTruthy();
    expect(s.data.get(VISITOR_ID_KEY)).toBe(first);
    expect(visitorId(s)).toBe(first);
  });

  it("gives different browsers different ids", () => {
    expect(visitorId(memoryStorage())).not.toBe(visitorId(memoryStorage()));
  });

  it("returns null when storage is unavailable", () => {
    expect(visitorId(null)).toBeNull();
    expect(visitorId(throwing)).toBeNull();
  });
});

describe("one count per browser per day", () => {
  it("counts the first visit of the day, then stops", () => {
    const s = memoryStorage();
    expect(shouldCount(s, "2026-10-05")).toBe(true);
    markCounted(s, "2026-10-05");
    // Revisiting, reloading, leaving and coming back: all the same day.
    expect(shouldCount(s, "2026-10-05")).toBe(false);
    expect(shouldCount(s, "2026-10-05")).toBe(false);
    expect(s.data.get(LAST_COUNTED_KEY)).toBe("2026-10-05");
  });

  it("counts the same browser again the next day", () => {
    const s = memoryStorage({ [LAST_COUNTED_KEY]: "2026-10-05" });
    expect(shouldCount(s, "2026-10-06")).toBe(true);
  });

  it("never counts when storage is unavailable", () => {
    expect(shouldCount(null, "2026-10-05")).toBe(false);
    expect(shouldCount(throwing, "2026-10-05")).toBe(false);
    expect(() => markCounted(throwing, "2026-10-05")).not.toThrow();
  });
});

describe("parseCount", () => {
  it("accepts a whole non-negative total", () => {
    expect(parseCount({ total: 42 })).toBe(42);
    expect(parseCount({ total: 0 })).toBe(0);
    expect(parseCount({ total: 7.9 })).toBe(7);
  });

  it("rejects anything else", () => {
    for (const bad of [null, undefined, 5, "12", {}, { total: "12" }, { total: -1 }, { total: NaN }]) {
      expect(parseCount(bad)).toBeNull();
    }
  });
});
