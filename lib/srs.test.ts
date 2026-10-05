import { describe, expect, it } from "vitest";
import { itemsInSet } from "./items";
import { emptyProgress } from "./progress";
import { buildRound, getLeeches, MAX_REQUEUES, requeueMissed, REQUEUE_GAP, ROUND_LENGTH } from "./srs";

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

  it("stops requeueing an item after MAX_REQUEUES", () => {
    const limit = { counts: new Map<string, number>(), key: (i: (typeof ones)[number]) => i.id };
    let q = ones.slice(0, 8);
    // Miss the same item every time it comes round.
    let at = 0;
    for (let i = 0; i < 5; i++) {
      q = requeueMissed(q, at, limit);
      at += REQUEUE_GAP;
    }
    expect(limit.counts.get("ones-1")).toBe(MAX_REQUEUES);
    expect(q.filter((i) => i.id === "ones-1")).toHaveLength(1 + MAX_REQUEUES);
  });

  it("counts a requeue only when one actually happens", () => {
    const limit = { counts: new Map<string, number>(), key: (i: (typeof ones)[number]) => i.id };
    const q = ones.slice(0, 6);
    requeueMissed(q, 5, limit); // no room
    expect(limit.counts.size).toBe(0);
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
