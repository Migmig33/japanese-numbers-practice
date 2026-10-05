import { ITEMS_BY_ID, itemsInSet } from "./items";
import type { Item } from "./types";

/*
 * "Build the number": a number such as 3,684 is written as one dataset item per
 * non-zero place — 三千 + 六百 + 八十 + 四 — so every reading comes straight from the
 * dataset, sound changes included. Nothing is derived here beyond joining chunks.
 */

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

export function checkBuild(n: number, picked: readonly string[]): boolean {
  return picked.length > 0 && picked.join("") === kanjiFor(n);
}

/** A round's numbers, nudged toward the sound-change hundreds and thousands. */
export function randomNumber(max: number, rng: () => number = Math.random, min = 10): number {
  let n = min + Math.floor(rng() * (max - min + 1));
  if (max >= 100 && rng() < 0.3) {
    const h = [3, 6, 8][Math.floor(rng() * 3)]!;
    n = n - (Math.floor(n / 100) % 10) * 100 + h * 100;
  }
  if (max >= 1000 && rng() < 0.3) {
    const th = [3, 8][Math.floor(rng() * 2)]!;
    n = n - (Math.floor(n / 1000) % 10) * 1000 + th * 1000;
  }
  return Math.min(Math.max(n, min), max);
}

export function buildNumbers(count: number, max: number, rng: () => number = Math.random, min = 10): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (let guard = 0; out.length < count && guard < count * 50; guard++) {
    const n = randomNumber(max, rng, min);
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
 * The characters to choose from: the answer's own, plus the traps that catch the two
 * classic spelling mistakes — a 一 in front of 十/百/千, and a 〇 for an empty place.
 */
export function buildTiles(n: number, rng: () => number = Math.random): Tile[] {
  const answer = [...kanjiFor(n)];
  const traps: string[] = [];
  const { th, h, t } = digitsOf(n);
  if (th === 1 || h === 1 || t === 1) traps.push("一");
  if (String(n).includes("0")) traps.push("〇");
  const fill = shuffle(KANJI_POOL, rng).slice(0, Math.max(2, MAX_TILES - answer.length - traps.length));
  const labels = [...answer, ...traps, ...fill].slice(0, Math.max(MAX_TILES, answer.length + traps.length));
  return shuffle(labels.map((label, i) => ({ key: `k${i}-${label}`, label })), rng);
}

// ---- Multiple choice: pick the kanji for each place --------------------------------

export const OPTION_COUNT = 4;

export type Step = {
  answer: Item;
  /** OPTION_COUNT choices, shuffled, always including `answer`. */
  options: Item[];
};

export type ChoiceQuestion = {
  id: string;
  /** The number as digits, e.g. "1,024". */
  prompt: string;
  /** Extra words under the prompt, for questions digits alone don't pin down. */
  hint?: string;
  /** What the learner is choosing — the native counting words aren't kanji. */
  unit: "kanji" | "word";
  steps: Step[];
};

function optionsFrom(answer: Item, pool: readonly Item[], rng: () => number): Item[] {
  const others = shuffle(pool.filter((i) => i.id !== answer.id), rng).slice(0, OPTION_COUNT - 1);
  return shuffle([answer, ...others], rng);
}

/** One question per number: a step for each non-zero place, biggest first. */
export function numberQuestion(n: number, rng: () => number = Math.random): ChoiceQuestion {
  return {
    id: `n-${n}`,
    prompt: n.toLocaleString("en"),
    unit: "kanji",
    steps: chunksFor(n).map((answer) => ({ answer, options: optionsFrom(answer, samePlace(answer), rng) })),
  };
}

/** The native counting words are a single choice — they aren't built from places. */
export function nativeQuestion(value: number, rng: () => number = Math.random): ChoiceQuestion {
  const pool = itemsInSet("native");
  const answer = pool.find((i) => i.value === value);
  if (!answer) throw new Error(`nativeQuestion: no native word for ${value}`);
  return {
    id: `native-${value}`,
    prompt: String(value),
    hint: "counting things",
    unit: "word",
    steps: [{ answer, options: optionsFrom(answer, pool, rng) }],
  };
}

export const answerKanji = (q: ChoiceQuestion) => q.steps.map((s) => s.answer.jp).join("");
export const answerReading = (q: ChoiceQuestion) => q.steps.map((s) => s.answer.readings[0]).join(" ");

export function checkChoice(q: ChoiceQuestion, picked: readonly Item[]): boolean {
  return picked.length === q.steps.length && q.steps.every((s, i) => picked[i]?.id === s.answer.id);
}

/** What to say after a miss: the first wrong place, then the rule behind the right one. */
export function choiceNotes(q: ChoiceQuestion, picked: readonly Item[]): string[] {
  const notes: string[] = [];
  const i = q.steps.findIndex((s, k) => picked[k]?.id !== s.answer.id);
  const step = i >= 0 ? q.steps[i] : undefined;
  if (step) {
    const got = picked[i];
    const place = q.steps.length > 1 ? `Place ${i + 1} of ${q.steps.length}: ` : "";
    const sentence = got
      ? `${q.prompt} needs ${step.answer.jp} (${step.answer.readings[0]}), not ${got.jp} (${got.readings[0]}).`
      : `nothing chosen here — ${q.prompt} needs ${step.answer.jp} (${step.answer.readings[0]}).`;
    notes.push(place ? place + sentence : sentence.charAt(0).toUpperCase() + sentence.slice(1));
    if (step.answer.note) notes.push(step.answer.note);
  }
  for (const s of q.steps) {
    if (s.answer.note && s.answer.note !== step?.answer.note && (s.answer.set === "hundreds" || s.answer.set === "thousands")) {
      notes.push(s.answer.note);
    }
  }
  return notes.length ? notes : ["Work left to right: thousands, hundreds, tens, then ones."];
}

export type RoundOptions = { max: number; native?: boolean };

export function buildQuestions(count: number, { max, native = false }: RoundOptions, rng: () => number = Math.random): ChoiceQuestion[] {
  const nativeCount = native ? Math.max(1, Math.round(count / 4)) : 0;
  const questions = buildNumbers(count - nativeCount, max, rng, 1).map((n) => numberQuestion(n, rng));
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rng).slice(0, nativeCount);
  questions.push(...values.map((v) => nativeQuestion(v, rng)));
  return shuffle(questions, rng);
}

/** The rule(s) to show after a miss. */
export function buildNotes(n: number, picked: readonly string[]): string[] {
  const notes: string[] = [];
  const kanji = kanjiFor(n);
  if (picked.includes("〇")) {
    notes.push(`Leave empty places out — ${n.toLocaleString("en")} is ${kanji}, with nothing for the zero.`);
  }
  const strayOne = picked.some((p, i) => p === "一" && ["十", "百", "千"].includes(picked[i + 1] ?? ""));
  if (strayOne) notes.push("10, 100 and 1,000 are just 十, 百 and 千 — no 一 in front.");
  for (const c of chunksFor(n)) {
    if ((c.set === "hundreds" || c.set === "thousands") && c.note) notes.push(c.note);
  }
  if (notes.length === 0) notes.push("Build it place by place, left to right: thousands, hundreds, tens, then ones.");
  return notes;
}
