import { chunksFor, kanaFor, kanjiFor, readingFor } from "./compose";

/*
 * Numbers above 9,999. Japanese groups digits in fours, not threes: 万 is 10,000 and
 * 億 is 100,000,000, so 12,345,678 is 千二百三十四万五千六百七十八 — "1,234 man, 5,678".
 *
 * Each group's multiplier is spelled by the ≤9,999 code in compose.ts, so every reading
 * still comes from the dataset and keeps its sound changes (六百万 roppyakuman,
 * 八千万 hassenman). Only two forms are special-cased, both well established:
 * a multiplier of 1 takes 一 (一万 ichiman, 一億 ichioku), and a multiplier of exactly
 * 1,000 takes 一千 (一千万 issenman).
 */

export const MAN = 10_000;
export const OKU = 100_000_000;
export const MAX_NUMBER = 1_000_000_000;

function assertRange(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER) throw new Error(`number ${n} out of range`);
}

const groupsOf = (n: number) => ({
  oku: Math.floor(n / OKU),
  man: Math.floor((n % OKU) / MAN),
  rest: n % MAN,
});

/** The multiplier in front of 万 or 億. */
function multiplierKanji(m: number): string {
  if (m === 1) return "一";
  if (m === 1000) return "一千";
  return kanjiFor(m);
}

function multiplierReading(m: number): string {
  if (m === 1) return "ichi";
  if (m === 1000) return "issen";
  // Within one group the places run together: 12 → juuni, 300 → sanbyaku.
  return readingFor(m).replace(/ /g, "");
}

function multiplierKana(m: number): string {
  if (m === 1) return "いち";
  if (m === 1000) return "いっせん";
  return kanaFor(m).replace(/ /g, "");
}

export function numberKanji(n: number): string {
  assertRange(n);
  const { oku, man, rest } = groupsOf(n);
  return (
    (oku ? `${multiplierKanji(oku)}億` : "") +
    (man ? `${multiplierKanji(man)}万` : "") +
    (rest ? kanjiFor(rest) : "")
  );
}

/** Primary reading, a space between places: "ichioku nisen sanbyaku man yonjuu go". */
export function numberReading(n: number): string {
  assertRange(n);
  const { oku, man, rest } = groupsOf(n);
  const parts: string[] = [];
  if (oku) parts.push(`${multiplierReading(oku)}oku`);
  if (man) parts.push(`${multiplierReading(man)}man`);
  if (rest) parts.push(readingFor(rest));
  return parts.join(" ");
}

/** The same reading written in hiragana. */
export function numberKana(n: number): string {
  assertRange(n);
  const { oku, man, rest } = groupsOf(n);
  const parts: string[] = [];
  if (oku) parts.push(`${multiplierKana(oku)}おく`);
  if (man) parts.push(`${multiplierKana(man)}まん`);
  if (rest) parts.push(kanaFor(rest));
  return parts.join(" ");
}

/**
 * Every reading a learner could reasonably type. Only the ones place varies
 * (yon/shi, nana/shichi, kyuu/ku), and at most once per group, so the number of
 * combinations stays tiny.
 */
export function acceptableReadings(n: number): string[] {
  assertRange(n);
  const { oku, man, rest } = groupsOf(n);

  const variantsFor = (m: number, suffix: string): string[] => {
    if (m === 1) return [`ichi${suffix}`];
    if (m === 1000) return [`issen${suffix}`];
    return groupVariants(m).map((r) => r.replace(/ /g, "") + suffix);
  };

  const groups: string[][] = [];
  if (oku) groups.push(variantsFor(oku, "oku"));
  if (man) groups.push(variantsFor(man, "man"));
  if (rest) groups.push(groupVariants(rest));

  // Cartesian product across the groups.
  return groups.reduce<string[]>((acc, options) => acc.flatMap((a) => options.map((o) => (a ? `${a} ${o}` : o))), [""]);
}

/** Readings of a 1–9,999 group, varying only the final ones place. */
function groupVariants(m: number): string[] {
  const chunks = chunksFor(m);
  const last = chunks[chunks.length - 1]!;
  const head = chunks.slice(0, -1).map((c) => c.readings[0]).join(" ");
  const tails = last.set === "ones" ? last.readings : [last.readings[0]!];
  return tails.map((t) => (head ? `${head} ${t}` : t));
}

/** Numbers whose zeros are the lesson: 10, 100, 2,000, 10,000, 一億 and so on. */
export function roundNumbers(max: number): number[] {
  const out: number[] = [];
  for (let place = 10; place <= max; place *= 10) {
    for (const d of [1, 2, 3, 5, 6, 8]) {
      const n = d * place;
      if (n >= 10 && n <= max) out.push(n);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}
