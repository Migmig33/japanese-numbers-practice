import { describe, expect, it } from "vitest";
import { itemsInSet } from "./items";
import { emptyProgress } from "./progress";
import { buildRound, getLeeches, requeueMissed, ROUND_LENGTH } from "./srs";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const ones = itemsInSet("ones");

describe("buildRound", () => {
  it("draws 12 distinct items from a big pool", () => {
    const round = buildRound(itemsInSet("teens-tens"), ROUND_LENGTH, seeded(1));
    expect(round).toHaveLength(12);
    expect(new Set(round.map((i) => i.id)).size).toBe(12);
  });

  it("repeats a small pool without back-to-back duplicates", () => {
    const pool = itemsInSet("ampm");
    for (let s = 0; s < 50; s++) {
      const round = buildRound(pool, ROUND_LENGTH, seeded(s));
      expect(round).toHaveLength(12);
      for (let i = 1; i < round.length; i++) expect(round[i]!.id).not.toBe(round[i - 1]!.id);
    }
  });

  it("handles a one-item pool and an empty pool", () => {
    expect(buildRound(itemsInSet("half"))).toHaveLength(12);
    expect(buildRound([])).toEqual([]);
  });
});

describe("requeueMissed", () => {
  it("brings the missed item back two questions later and keeps the length", () => {
    const q = ones.slice(0, 6);
    const next = requeueMissed(q, 1);
    expect(next.map((i) => i.value)).toEqual([1, 2, 3, 2, 4, 5]);
    expect(next).toHaveLength(6);
  });

  it("does not requeue when there is no room left", () => {
    const q = ones.slice(0, 6);
    expect(requeueMissed(q, 4)).toEqual(q);
    expect(requeueMissed(q, 5)).toEqual(q);
  });
});

describe("getLeeches", () => {
  it("flags items under 50% after 4+ attempts", () => {
    const p = {
      ...emptyProgress(),
      items: {
        "ones-1": { attempts: 4, correct: 1 }, // leech
        "ones-2": { attempts: 4, correct: 2 }, // exactly 50%: not a leech
        "ones-3": { attempts: 3, correct: 0 }, // too few attempts
        "ones-4": { attempts: 10, correct: 4 }, // leech
      },
    };
    expect(getLeeches(p, ones).map((i) => i.id)).toEqual(["ones-1", "ones-4"]);
  });
});
