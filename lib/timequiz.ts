import { ITEMS_BY_ID } from "./items";
import { matchesReading } from "./normalize";
import { ROUND_LENGTH } from "./srs";
import { digitalTime, randomTime, sameTime, timeKanji, timeReading, type ClockTime } from "./time";
import type { Difficulty } from "./modes";

/*
 * Three ways to practise telling the time, mirroring the numbers quiz:
 *   read — the time in kanji, pick the clock time it means
 *   set  — the time in kanji, drag the hands to match
 *   say  — the time in kanji, type the reading
 *
 * Every reading comes from lib/time.ts, so the irregular hours (四時 yoji, 九時 kuji)
 * and the pun minutes stay exactly as the dataset gives them.
 */

export const TIME_MODE_IDS = ["time-read", "time-set", "time-say"] as const;
export type TimeModeId = (typeof TIME_MODE_IDS)[number];

export type TimeMode = {
  id: TimeModeId;
  difficulty: Difficulty;
  name: string;
  task: string;
  blurb: string;
  sample: string;
};

export const TIME_MODES: Record<TimeModeId, TimeMode> = {
  "time-read": {
    id: "time-read",
    difficulty: "Easy",
    name: "Read it",
    task: "Pick the time the kanji means",
    blurb: "Four clock times to choose from. The quickest way to meet 四時 yoji and 九時 kuji.",
    sample: "三時半 → 3:30",
  },
  "time-set": {
    id: "time-set",
    difficulty: "Medium",
    name: "Set it",
    task: "Drag the hands to match",
    blurb: "Read the time, then put it on a real clock face. Minute by minute, not just on the fives.",
    sample: "一時二十九分 → 1:29",
  },
  "time-say": {
    id: "time-say",
    difficulty: "Hard",
    name: "Say it",
    task: "Type the reading",
    blurb: "No options at all — you produce ippun, roppun and juppun yourself.",
    sample: "四時 → yoji",
  },
};

export type Period = "gozen" | "gogo";

export type TimeQuestion = {
  id: string;
  time: ClockTime;
  /** 午前 or 午後 in front, when the learner asked for them. */
  period?: Period;
  kanji: string;
  reading: string;
  digital: string;
  /** Only for "time-read": the clock times to choose between. */
  options?: string[];
};

const item = (id: string) => {
  const i = ITEMS_BY_ID.get(id);
  if (!i) throw new Error(`timequiz: missing ${id}`);
  return i;
};

const periodItem = (p: Period) => item(`ampm-${p}`);

export function questionKanji(time: ClockTime, period?: Period): string {
  return (period ? periodItem(period).jp : "") + timeKanji(time);
}

export function questionReading(time: ClockTime, period?: Period): string {
  return (period ? `${periodItem(period).readings[0]} ` : "") + timeReading(time);
}

export function questionDigital(time: ClockTime, period?: Period): string {
  return digitalTime(time) + (period ? (period === "gozen" ? " a.m." : " p.m.") : "");
}

const shuffle = <T,>(xs: readonly T[], rng: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

const wrapHour = (h: number) => ((h - 1 + 12) % 12) + 1;

/**
 * Wrong times a learner might actually pick: the neighbouring hour, the minutes read as
 * the hour, or the other half of the day.
 */
export function timeOptions(time: ClockTime, period: Period | undefined, rng: () => number = Math.random, count = 4): string[] {
  const right = questionDigital(time, period);
  const wrong = new Set<string>();
  const add = (t: ClockTime, p = period) => {
    const s = questionDigital(t, p);
    if (s !== right) wrong.add(s);
  };
  add({ ...time, hour: wrapHour(time.hour + 1) });
  add({ ...time, hour: wrapHour(time.hour - 1) });
  if (period) add(time, period === "gozen" ? "gogo" : "gozen");
  if (time.minute !== 0) add({ ...time, minute: 0 });
  if (time.minute !== 30) add({ ...time, minute: 30 });
  // The classic slip: reading the minutes as the hour.
  if (time.minute >= 1 && time.minute <= 12) add({ hour: time.minute, minute: time.hour });
  for (const d of [5, 10, 15]) add({ ...time, minute: (time.minute + d) % 60 });

  return shuffle([right, ...shuffle([...wrong], rng).slice(0, count - 1)], rng);
}

export function buildTimeRound(
  mode: TimeModeId,
  { periods = false, length = ROUND_LENGTH }: { periods?: boolean; length?: number } = {},
  rng: () => number = Math.random,
): TimeQuestion[] {
  const out: TimeQuestion[] = [];
  let prev: ClockTime | undefined;
  while (out.length < length) {
    const time = randomTime(rng, prev);
    prev = time;
    // A clock face shows no a.m. or p.m., so "Set it" never asks for one.
    const period: Period | undefined =
      periods && mode !== "time-set" ? (rng() < 0.5 ? "gozen" : "gogo") : undefined;
    const q: TimeQuestion = {
      id: `${mode}-${period ?? ""}${time.hour}-${time.minute}`,
      time,
      ...(period ? { period } : {}),
      kanji: questionKanji(time, period),
      reading: questionReading(time, period),
      digital: questionDigital(time, period),
    };
    if (out.some((o) => o.id === q.id)) continue;
    if (mode === "time-read") q.options = timeOptions(time, period, rng);
    out.push(q);
  }
  return out;
}

export function checkTimeAnswer(q: TimeQuestion, mode: TimeModeId, given: string | ClockTime | null): boolean {
  if (given === null || given === "") return false;
  if (mode === "time-set") return typeof given === "object" && sameTime(given, q.time);
  if (mode === "time-read") return given === q.digital;
  return typeof given === "string" && matchesReading(given, [q.reading]);
}
