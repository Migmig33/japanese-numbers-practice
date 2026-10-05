import { ITEMS_BY_ID } from "./items";
import { matchesReading } from "./normalize";
import type { Item } from "./types";

/*
 * "Build the number": a number such as 3,684 is written as one dataset item per
 * non-zero place — 三千 + 六百 + 八十 + 四 — so every reading comes straight from the
 * dataset, sound changes included. Nothing is derived here beyond joining chunks.
 */

export type BuildMode = "kanji" | "romaji";
export const BUILD_MAX = 9999;

export type Tile = {
  /** Unique per tile instance. */
  key: string;
  label: string;
};

function item(id: string): Item {
  const i = ITEMS_BY_ID.get(id);
  if (!i) throw new Error(`compose: missing item ${id}`);
  return i;
}

const digitsOf = (n: number) => ({
  th: Math.floor(n / 1000) % 10,
  h: Math.floor(n / 100) % 10,
  t: Math.floor(n / 10) % 10,
  o: n % 10,
});

/** The dataset items that spell `n`, biggest place first. */
export function chunksFor(n: number): Item[] {
  if (!Number.isInteger(n) || n < 1 || n > BUILD_MAX) throw new Error(`chunksFor: ${n} out of range`);
  const { th, h, t, o } = digitsOf(n);
  const out: Item[] = [];
  if (th) out.push(item(`thousands-${th * 1000}`));
  if (h) out.push(item(`hundreds-${h * 100}`));
  if (t) out.push(item(t === 1 ? "ones-10" : `teens-tens-${t * 10}`));
  if (o) out.push(item(`ones-${o}`));
  return out;
}

export const kanjiFor = (n: number) => chunksFor(n).map((c) => c.jp).join("");

/** Primary reading with a space between places, for display: "sanzen roppyaku hachijuu yon". */
export const readingFor = (n: number) => chunksFor(n).map((c) => c.readings[0]).join(" ");

/** Every accepted reading: the ones place may use either of its readings (yon/shi …). */
export function acceptableReadings(n: number): string[] {
  const chunks = chunksFor(n);
  const last = chunks[chunks.length - 1]!;
  const prefix = chunks.slice(0, -1).map((c) => c.readings[0]).join("");
  return last.set === "ones" ? last.readings.map((r) => prefix + r) : [prefix + last.readings[0]];
}

export function checkBuild(n: number, mode: BuildMode, picked: readonly string[]): boolean {
  if (picked.length === 0) return false;
  return mode === "kanji" ? picked.join("") === kanjiFor(n) : matchesReading(picked.join(""), acceptableReadings(n));
}

/** A round's numbers: two digits or more, nudged toward the sound-change hundreds and thousands. */
export function randomNumber(max: number, rng: () => number = Math.random): number {
  let n = 10 + Math.floor(rng() * (max - 9));
  if (max >= 100 && rng() < 0.3) {
    const h = [3, 6, 8][Math.floor(rng() * 3)]!;
    n = n - (Math.floor(n / 100) % 10) * 100 + h * 100;
  }
  if (max >= 1000 && rng() < 0.3) {
    const th = [3, 8][Math.floor(rng() * 2)]!;
    n = n - (Math.floor(n / 1000) % 10) * 1000 + th * 1000;
  }
  return Math.min(Math.max(n, 10), max);
}

export function buildNumbers(count: number, max: number, rng: () => number = Math.random): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (let guard = 0; out.length < count && guard < count * 50; guard++) {
    const n = randomNumber(max, rng);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function shuffle<T>(xs: readonly T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const MAX_TILES = 9;
const KANJI_POOL = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千"];

/** Other items that could sit in the same place as `c`. */
function samePlace(c: Item): Item[] {
  if (c.set === "thousands" || c.set === "hundreds") return [...ITEMS_BY_ID.values()].filter((i) => i.set === c.set);
  if (c.id === "ones-10" || c.set === "teens-tens") {
    return [item("ones-10"), ...[2, 3, 4, 5, 6, 7, 8, 9].map((d) => item(`teens-tens-${d * 10}`))];
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => item(`ones-${d}`));
}

/**
 * The tiles to choose from: the answer's pieces plus distractors that set up the
 * classic mistakes — roku + hyaku for 600 in romaji, 一百 or a 〇 in kanji.
 */
export function buildTiles(n: number, mode: BuildMode, rng: () => number = Math.random): Tile[] {
  const chunks = chunksFor(n);

  if (mode === "kanji") {
    const answer = [...kanjiFor(n)];
    const traps: string[] = [];
    const { th, h, t } = digitsOf(n);
    if (th === 1 || h === 1 || t === 1) traps.push("一");
    if (String(n).includes("0")) traps.push("〇");
    const fill = shuffle(KANJI_POOL, rng).slice(0, Math.max(2, MAX_TILES - answer.length - traps.length));
    const labels = [...answer, ...traps, ...fill].slice(0, Math.max(MAX_TILES, answer.length + traps.length));
    return shuffle(labels.map((label, i) => ({ key: `k${i}-${label}`, label })), rng);
  }

  const correct = chunks.map((c) => c.readings[0]!);
  // Readings that would also be right (shi for yon, …) must never appear as traps.
  const forbidden = new Set(chunks.flatMap((c) => c.readings));
  const traps: string[] = [];
  const add = (r: string | undefined) => {
    if (r && !forbidden.has(r) && !traps.includes(r)) traps.push(r);
  };
  for (const c of chunks) {
    if ((c.set === "hundreds" || c.set === "thousands") && c.note && c.value !== 100 && c.value !== 1000) {
      const d = c.set === "hundreds" ? c.value! / 100 : c.value! / 1000;
      add(item(`ones-${d}`).readings[0]);
      add(item(c.set === "hundreds" ? "hundreds-100" : "thousands-1000").readings[0]);
    }
  }
  for (const c of shuffle(chunks, rng)) {
    add(shuffle(samePlace(c).filter((i) => i.id !== c.id), rng)[0]?.readings[0]);
  }
  const room = Math.max(3, MAX_TILES - correct.length);
  const labels = [...correct, ...traps.slice(0, room)];
  return shuffle(labels.map((label, i) => ({ key: `r${i}-${label}`, label })), rng);
}

/** The rule(s) to show after a miss. */
export function buildNotes(n: number, mode: BuildMode, picked: readonly string[]): string[] {
  const notes: string[] = [];
  const kanji = kanjiFor(n);
  if (mode === "kanji") {
    if (picked.includes("〇")) notes.push(`Leave empty places out — ${n.toLocaleString("en")} is ${kanji}, with nothing for the zero.`);
    const strayOne = picked.some((p, i) => p === "一" && ["十", "百", "千"].includes(picked[i + 1] ?? ""));
    if (strayOne) notes.push("10, 100 and 1,000 are just 十, 百 and 千 — no 一 in front.");
  }
  for (const c of chunksFor(n)) {
    if ((c.set === "hundreds" || c.set === "thousands") && c.note) notes.push(c.note);
  }
  if (notes.length === 0) notes.push("Build it place by place, left to right: thousands, hundreds, tens, then ones.");
  return notes;
}
