import { ITEMS_BY_ID, kanjiNumber } from "./items";
import type { Item } from "./types";

/*
 * Clock times beyond the ten single-minute items. The dataset's minute readings are the
 * authority: a compound minute keeps the ones digit's form exactly as the table gives it
 * (29分 → nijuu + kyuufun), and a whole ten uses 十分 juppun (30分 → san + juppun).
 * Nothing here invents a reading; it only joins the table's own forms.
 */

function item(id: string): Item {
  const i = ITEMS_BY_ID.get(id);
  if (!i) throw new Error(`time: missing item ${id}`);
  return i;
}

const minuteItem = (m: number) => item(`minutes-${m}`);
/** ni, san, yon, go — the multiplier in front of 十. */
const digitReading = (d: number) => item(`ones-${d}`).readings[0]!;

export const MAX_MINUTE = 59;

/** Reading for a minute count of 1–59. */
export function minuteReading(m: number): string {
  if (!Number.isInteger(m) || m < 1 || m > MAX_MINUTE) throw new Error(`minuteReading: ${m} out of range`);
  if (m <= 10) return minuteItem(m).readings[0]!;
  const tens = Math.floor(m / 10);
  const ones = m % 10;
  // A whole ten is that digit plus 十分: 20分 nijuppun, 50分 gojuppun.
  if (ones === 0) return digitReading(tens) + minuteItem(10).readings[0]!;
  // Otherwise the tens are spoken as a plain number and the ones keep their 分 form.
  const tensPart = tens === 1 ? item("ones-10").readings[0]! : digitReading(tens) + item("ones-10").readings[0]!;
  return tensPart + minuteItem(ones).readings[0]!;
}

export function minuteKanji(m: number): string {
  if (!Number.isInteger(m) || m < 1 || m > MAX_MINUTE) throw new Error(`minuteKanji: ${m} out of range`);
  return `${kanjiNumber(m)}分`;
}

export type ClockTime = { hour: number; minute: number }; // hour 1–12, minute 0–59

function assertTime({ hour, minute }: ClockTime) {
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) throw new Error(`hour ${hour} out of range`);
  if (!Number.isInteger(minute) || minute < 0 || minute > MAX_MINUTE) throw new Error(`minute ${minute} out of range`);
}

/** Half past is normally 半, not 三十分; `han: false` spells the thirty out. */
export function timeKanji({ hour, minute }: ClockTime, { han = true } = {}): string {
  assertTime({ hour, minute });
  const h = item(`hours-${hour}`).jp;
  if (minute === 0) return h;
  if (minute === 30 && han) return `${h}${item("half-han").jp}`;
  return `${h}${minuteKanji(minute)}`;
}

export function timeReading({ hour, minute }: ClockTime, { han = true } = {}): string {
  assertTime({ hour, minute });
  const h = item(`hours-${hour}`).readings[0]!;
  if (minute === 0) return h;
  if (minute === 30 && han) return `${h} ${item("half-han").readings[0]}`;
  return `${h} ${minuteReading(minute)}`;
}

/** 3:05 */
export const digitalTime = ({ hour, minute }: ClockTime) => `${hour}:${String(minute).padStart(2, "0")}`;

export const sameTime = (a: ClockTime, b: ClockTime) => a.hour === b.hour && a.minute === b.minute;

/**
 * A time to practise. Weighted toward o'clock, half past and the five-minute marks —
 * the ones a learner meets first — while still reaching any minute.
 */
export function randomTime(rng: () => number = Math.random, prev?: ClockTime): ClockTime {
  for (;;) {
    const hour = 1 + Math.floor(rng() * 12);
    const r = rng();
    const minute =
      r < 0.15 ? 0 : r < 0.3 ? 30 : r < 0.65 ? 5 * Math.floor(rng() * 12) : Math.floor(rng() * 60);
    const t = { hour, minute };
    if (!prev || !sameTime(prev, t)) return t;
  }
}
