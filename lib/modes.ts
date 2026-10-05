import { acceptableReadings, MAX_NUMBER, numberKanji, numberReading, roundNumbers } from "./bignumbers";
import { nativeQuestion, numberQuestion, type ChoiceQuestion } from "./compose";
import { matchesReading } from "./normalize";
import { ROUND_LENGTH } from "./srs";

/*
 * Three ways to practise the same numbers, all open from the start — a learner picks
 * whichever direction they want to work in:
 *   build    — digits in, pick the kanji for each place
 *   identify — kanji in, pick the number
 *   recall   — digits in, type the reading, no options
 * A round is graded when it finishes; nothing is locked behind anything else.
 */

export const MODE_IDS = ["build", "identify", "recall"] as const;
export type ModeId = (typeof MODE_IDS)[number];

/** Numbers whose zeros are the lesson, guaranteed per round. */
export const ROUND_NUMBERS_PER_ROUND = 3;

/** How hard a mode feels, shown on its card so a learner can choose. */
export type Difficulty = "Easy" | "Medium" | "Hard";

export type Mode = {
  id: ModeId;
  difficulty: Difficulty;
  name: string;
  /** What the learner does, in their words. */
  task: string;
  blurb: string;
  max: number;
  sample: string;
};

export const MODES: Record<ModeId, Mode> = {
  build: {
    id: "build",
    difficulty: "Easy",
    name: "Build it",
    task: "Pick the kanji for each place",
    blurb: "A number in digits, four choices per place — each one labelled with its reading. The gentlest way in.",
    max: 9_999,
    sample: "684 → 六百 八十 四",
  },
  identify: {
    id: "identify",
    difficulty: "Medium",
    name: "Read it",
    task: "Pick the number the kanji means",
    blurb: "The other way round, and up into 万. No readings to lean on this time.",
    max: 9_999_999,
    sample: "三百万 → 3,000,000",
  },
  recall: {
    id: "recall",
    difficulty: "Hard",
    name: "Say it",
    task: "Type the reading",
    blurb: "No options at all, all the way to 十億. The hardest of the three.",
    max: MAX_NUMBER,
    sample: "1,000,000,000 → juuoku",
  },
};

export type Question =
  | ({ kind: "build" } & ChoiceQuestion)
  | { kind: "identify"; id: string; n: number; kanji: string; reading: string; options: number[] }
  | { kind: "recall"; id: string; n: number; kanji: string; reading: string };

// ---- Grading -----------------------------------------------------------------------

export type Grade = { letter: string; label: string };

const SCALE: { min: number; letter: string; label: string }[] = [
  { min: 0.95, letter: "A+", label: "Nearly perfect" },
  { min: 0.9, letter: "A", label: "Excellent" },
  { min: 0.8, letter: "B", label: "Solid" },
  { min: 0.7, letter: "C", label: "Getting there" },
  { min: 0.6, letter: "D", label: "Shaky" },
  { min: 0, letter: "E", label: "Worth another go" },
];

export function gradeFor(accuracy: number): Grade {
  const band = SCALE.find((g) => accuracy >= g.min) ?? SCALE[SCALE.length - 1]!;
  return { letter: band.letter, label: band.label };
}

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
export function modeNumbers(mode: ModeId, length = ROUND_LENGTH, rng: () => number = Math.random): number[] {
  const { max } = MODES[mode];
  const zeros = shuffle(roundNumbers(max), rng).slice(0, ROUND_NUMBERS_PER_ROUND);
  const picked = new Set(zeros);
  // The rest skew small so a round stays readable, with the odd large one.
  while (picked.size < length) {
    const scale = rng();
    const ceiling = scale < 0.55 ? Math.min(max, 9_999) : scale < 0.85 ? Math.min(max, 999_999) : max;
    picked.add(1 + Math.floor(rng() * ceiling));
  }
  return shuffle([...picked], rng);
}

export function buildModeRound(
  mode: ModeId,
  { native = false, length = ROUND_LENGTH }: { native?: boolean; length?: number } = {},
  rng: () => number = Math.random,
): Question[] {
  if (mode === "build") {
    const natives = native ? Math.max(1, Math.round(length / 4)) : 0;
    const questions: Question[] = modeNumbers("build", length - natives, rng).map((n) => ({
      kind: "build" as const,
      ...numberQuestion(n, rng),
    }));
    const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rng).slice(0, natives);
    questions.push(...values.map((v) => ({ kind: "build" as const, ...nativeQuestion(v, rng) })));
    return shuffle(questions, rng);
  }
  return modeNumbers(mode, length, rng).map((n) =>
    mode === "identify"
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

/** Keeps stored mode keys honest. */
export const isModeId = (x: unknown): x is ModeId => MODE_IDS.includes(x as ModeId);
