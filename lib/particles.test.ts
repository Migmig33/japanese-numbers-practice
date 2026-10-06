import { describe, expect, it } from "vitest";
import {
  answerOf, buildParticleRound, checkParticleAnswer, gappedSentence, PARTICLE_ITEMS, PARTICLE_MODE_IDS,
  PARTICLE_MODES, PARTICLES, readingsOf, sentenceOf, spokenForm,
} from "./particles";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const TAUGHT = new Set(PARTICLES.map((p) => p.jp));

describe("the sentence bank", () => {
  it("has unique ids and enough for a round", () => {
    expect(new Set(PARTICLE_ITEMS.map((i) => i.id)).size).toBe(PARTICLE_ITEMS.length);
    expect(PARTICLE_ITEMS.length).toBeGreaterThanOrEqual(12);
  });

  it("points its gap at a real particle, and one the page teaches", () => {
    for (const item of PARTICLE_ITEMS) {
      expect(item.blank, item.id).toBeGreaterThanOrEqual(0);
      expect(item.blank, item.id).toBeLessThan(item.chunks.length);
      expect(TAUGHT.has(answerOf(item)), `${item.id} tests ${answerOf(item)}`).toBe(true);
    }
  });

  it("offers three wrong particles, never the right one twice", () => {
    for (const item of PARTICLE_ITEMS) {
      expect(item.distractors, item.id).toHaveLength(3);
      expect(new Set(item.distractors).size, item.id).toBe(3);
      expect(item.distractors, item.id).not.toContain(answerOf(item));
    }
  });

  it("never offers へ against に, since both would be correct", () => {
    for (const item of PARTICLE_ITEMS) {
      expect(item.distractors, item.id).not.toContain("へ");
    }
  });

  it("explains every answer and translates every sentence", () => {
    for (const item of PARTICLE_ITEMS) {
      expect(item.note.length, item.id).toBeGreaterThan(20);
      expect(item.english.length, item.id).toBeGreaterThan(5);
      expect(item.romaji.length, item.id).toBeGreaterThan(5);
      expect(item.romaji, item.id).toMatch(/^[a-z0-9 '-]+$/);
    }
  });

  it("writes は as wa and を as o in the romaji", () => {
    for (const item of PARTICLE_ITEMS) {
      const words = item.romaji.split(" ");
      if (answerOf(item) === "は") expect(words, item.id).toContain("wa");
      if (answerOf(item) === "を") expect(words, item.id).toContain("o");
    }
  });

  it("covers every particle in the reference table", () => {
    const tested = new Set(PARTICLE_ITEMS.map(answerOf));
    for (const p of PARTICLES) expect(tested.has(p.jp), `nothing tests ${p.jp}`).toBe(true);
  });
});

describe("gaps and sentences", () => {
  it("shows a gap where the particle belongs", () => {
    const item = PARTICLE_ITEMS[0]!;
    expect(gappedSentence(item)).toContain("＿");
    expect(gappedSentence(item)).not.toContain(answerOf(item));
    expect(sentenceOf(item)).toBe(item.chunks.join(""));
  });
});

describe("rounds", () => {
  it("fills a round without repeating a sentence", () => {
    for (const mode of PARTICLE_MODE_IDS) {
      for (let s = 0; s < 20; s++) {
        const round = buildParticleRound(mode, {}, seeded(s));
        expect(round).toHaveLength(12);
        expect(new Set(round.map((q) => q.id)).size).toBe(12);
      }
    }
  });

  it("gives four options when filling the gap, and the pieces when ordering", () => {
    for (const q of buildParticleRound("particle-pick", {}, seeded(1))) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(answerOf(q.item));
      expect(q.tiles).toBeUndefined();
    }
    for (const q of buildParticleRound("particle-order", {}, seeded(1))) {
      expect(q.tiles).toHaveLength(q.item.chunks.length);
      expect([...q.tiles!].sort()).toEqual([...q.item.chunks].sort());
      expect(q.options).toBeUndefined();
    }
  });

  it("labels the modes Easy and Medium", () => {
    expect(PARTICLE_MODE_IDS.map((id) => PARTICLE_MODES[id].difficulty)).toEqual(["Easy", "Medium"]);
  });
});

describe("marking", () => {
  const item = PARTICLE_ITEMS.find((i) => i.id === "o-1")!;

  it("marks the picked particle", () => {
    const q = { id: item.id, item, options: ["を", "が", "に", "で"] };
    expect(checkParticleAnswer(q, "particle-pick", "を")).toBe(true);
    expect(checkParticleAnswer(q, "particle-pick", "が")).toBe(false);
    expect(checkParticleAnswer(q, "particle-pick", null)).toBe(false);
  });

  it("marks the assembled sentence, order and all", () => {
    const q = { id: item.id, item, tiles: [...item.chunks] };
    expect(checkParticleAnswer(q, "particle-order", [...item.chunks])).toBe(true);
    expect(checkParticleAnswer(q, "particle-order", [...item.chunks].reverse())).toBe(false);
    expect(checkParticleAnswer(q, "particle-order", [])).toBe(false);
  });
});

describe("readings under each word", () => {
  it("lines a reading up with every chunk, for every item", () => {
    // The per-word readings shown under the sentence are a split of `romaji`, so this
    // alignment is what keeps them from sitting under the wrong words.
    for (const item of PARTICLE_ITEMS) {
      const readings = readingsOf(item);
      expect(readings, `${item.id} has ${item.romaji.split(/\s+/).length} readings for ${item.chunks.length} chunks`).not.toBeNull();
      expect(readings!).toHaveLength(item.chunks.length);
    }
  });

  it("returns null rather than misaligning when an item is malformed", () => {
    const broken = { ...PARTICLE_ITEMS[0]!, romaji: "only two" };
    expect(readingsOf(broken)).toBeNull();
  });

  it("keeps the tested particle's own reading in the list", () => {
    const item = PARTICLE_ITEMS.find((i) => i.id === "wa-1")!;
    expect(readingsOf(item)![item.blank]).toBe("wa");
  });
});

describe("what gets spoken", () => {
  it("speaks the kana for a particle said differently from how it is written", () => {
    const wa = PARTICLES.find((p) => p.jp === "は")!;
    const o = PARTICLES.find((p) => p.jp === "を")!;
    expect(spokenForm(wa)).toBe("わ");
    expect(spokenForm(o)).toBe("お");
  });

  it("speaks every other particle exactly as written", () => {
    for (const p of PARTICLES.filter((x) => !["は", "を"].includes(x.jp))) {
      expect(spokenForm(p)).toBe(p.jp);
    }
  });

  it("only overrides where the romaji really differs from the character", () => {
    for (const p of PARTICLES) {
      if (p.speak !== undefined) expect(p.speak).not.toBe(p.jp);
    }
  });
});
