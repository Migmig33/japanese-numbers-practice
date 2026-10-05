import { acceptableReadings, MAX_NUMBER, numberKanji, numberReading, roundNumbers } from "./bignumbers";
import { nativeQuestion, numberQuestion, type ChoiceQuestion } from "./compose";
import { matchesReading } from "./normalize";
import { ROUND_LENGTH } from "./srs";

/*
 * Three stages, each a different direction of travel:
 *   1 build   — digits in, pick the kanji for each place
 *   2 identify — kanji in, pick the number
 *   3 recall  — digits in, type the reading, no options
 * Pass a stage at PASS_RATIO and the next one opens.
 */

export const STAGE_IDS = [1, 2, 3] as const;
export type StageId = (typeof STAGE_IDS)[number];

/** Share of a round that must be right to open the next stage. */
export const PASS_RATIO = 0.7;
/** Numbers whose zeros are the lesson, guaranteed per round. */
export const ROUND_NUMBERS_PER_ROUND = 3;

export type Stage = {
  id: StageId;
  name: string;
  /** What the learner does, in their words. */
  task: string;
  blurb: string;
  max: number;
  sample: string;
};

export const STAGES: Record<StageId, Stage> = {
  1: {
    id: 1,
    name: "Build it",
    task: "Pick the kanji for each place",
    blurb: "A number in digits, four choices per place — each one labelled with its reading.",
    max: 9_999,
    sample: "684 → 六百 八十 四",
  },
  2: {
    id: 2,
    name: "Read it",
    task: "Pick the number the kanji means",
    blurb: "The other way round, and up into 万. No readings to lean on this time.",
    max: 9_999_999,
    sample: "三百万 → 3,000,000",
  },
  3: {
    id: 3,
    name: "Say it",
    task: "Type the reading",
    blurb: "No options at all, all the way to 十億.",
    max: MAX_NUMBER,
    sample: "1,000,000,000 → juuoku",
  },
};

export type Question =
  | ({ kind: "build" } & ChoiceQuestion)
  | { kind: "identify"; id: string; n: number; kanji: string; reading: string; options: number[] }
  | { kind: "recall"; id: string; n: number; kanji: string; reading: string };

const shuffle = <T,>(xs: readonly T[], rng: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Wrong answers a learner might actually believe: a place out, or a digit swapped. */
export function numberOptions(n: number, rng: () => number = Math.random, count = 4): number[] {
  const candidates = new Set<number>();
  const add = (x: number) => {
    if (Number.isInteger(x) && x >= 1 && x <= MAX_NUMBER && x !== n) candidates.add(x);
  };
  const digits = String(n);
  // A place out, in either direction — the mistake the kanji groupings actually cause.
  for (const k of [1, 2, 3]) {
    add(n * 10 ** k);
    add(n / 10 ** k);
  }
  // The same shape with a different leading digit.
  for (let d = 1; d <= 9; d++) add(Number(d + digits.slice(1)));
  add(n + 10 ** (digits.length - 1));

  const wrong = shuffle([...candidates], rng).slice(0, count - 1);
  if (wrong.length < count - 1) {
    // Near the ceiling most variants overflow; fall back to neighbouring magnitudes.
    for (let k = 1; wrong.length < count - 1 && k <= 9; k++) {
      for (const x of [Math.floor(n / 10 ** k), Math.floor(n / 10 ** k) * 9]) {
        if (wrong.length >= count - 1) break;
        if (Number.isInteger(x) && x >= 1 && x <= MAX_NUMBER && x !== n && !wrong.includes(x)) wrong.push(x);
      }
    }
  }
  return shuffle([n, ...wrong], rng);
}

/** A round's numbers: mostly free choice, always ROUND_NUMBERS_PER_ROUND zero-heavy ones. */
export function stageNumbers(stage: StageId, length = ROUND_LENGTH, rng: () => number = Math.random): number[] {
  const { max } = STAGES[stage];
  const zeros = shuffle(roundNumbers(max), rng).slice(0, ROUND_NUMBERS_PER_ROUND);
  const picked = new Set(zeros);
  // The rest skew small so a round stays readable, with the odd large one.
  while (picked.size < length) {
    const scale = rng();
    const ceiling = scale < 0.55 ? Math.min(max, 9_999) : scale < 0.85 ? Math.min(max, 999_999) : max;
    const n = 1 + Math.floor(rng() * ceiling);
    picked.add(n);
  }
  return shuffle([...picked], rng);
}

export function buildStageRound(
  stage: StageId,
  { native = false, length = ROUND_LENGTH }: { native?: boolean; length?: number } = {},
  rng: () => number = Math.random,
): Question[] {
  if (stage === 1) {
    // Stage 1 keeps the place-by-place chooser, and the same zeros guarantee as the rest.
    const natives = native ? Math.max(1, Math.round(length / 4)) : 0;
    const questions: Question[] = stageNumbers(1, length - natives, rng).map((n) => ({
      kind: "build" as const,
      ...numberQuestion(n, rng),
    }));
    const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rng).slice(0, natives);
    questions.push(...values.map((v) => ({ kind: "build" as const, ...nativeQuestion(v, rng) })));
    return shuffle(questions, rng);
  }
  return stageNumbers(stage, length, rng).map((n) =>
    stage === 2
      ? {
          kind: "identify" as const,
          id: `i-${n}`,
          n,
          kanji: numberKanji(n),
          reading: numberReading(n),
          options: numberOptions(n, rng),
        }
      : { kind: "recall" as const, id: `r-${n}`, n, kanji: numberKanji(n), reading: numberReading(n) },
  );
}

export function checkAnswer(q: Question, given: string | number | null): boolean {
  if (given === null || given === "") return false;
  if (q.kind === "identify") return given === q.n;
  if (q.kind === "recall") return typeof given === "string" && matchesReading(given, acceptableReadings(q.n));
  return false; // "build" is checked by checkChoice, which compares the picked items
}

export const passed = (correct: number, total: number) => total > 0 && correct / total >= PASS_RATIO;

/** The stage a learner has reached, clamped to what exists. */
export const clampStage = (n: unknown): StageId =>
  STAGE_IDS.includes(n as StageId) ? (n as StageId) : 1;

export const nextStage = (s: StageId): StageId | null => (s < 3 ? ((s + 1) as StageId) : null);
