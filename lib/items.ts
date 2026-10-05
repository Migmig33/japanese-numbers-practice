import type { Item, SetId } from "./types";

/*
 * Number items are generated from the rules in CLAUDE.md. Time items are irregular and
 * copied verbatim from the table there — never derive them.
 */

type Digit = { jp: string; readings: string[] };

// 1–10. The first reading is the primary one, used when the digit is a multiplier.
const DIGITS: Record<number, Digit> = {
  1: { jp: "一", readings: ["ichi"] },
  2: { jp: "二", readings: ["ni"] },
  3: { jp: "三", readings: ["san"] },
  4: { jp: "四", readings: ["yon", "shi"] },
  5: { jp: "五", readings: ["go"] },
  6: { jp: "六", readings: ["roku"] },
  7: { jp: "七", readings: ["nana", "shichi"] },
  8: { jp: "八", readings: ["hachi"] },
  9: { jp: "九", readings: ["kyuu", "ku"] },
  10: { jp: "十", readings: ["juu"] },
};

const ALT_NOTES: Record<number, string> = {
  4: "四 reads yon or shi. Yon is the safer default.",
  7: "七 reads nana or shichi. Both are accepted.",
  9: "九 reads kyuu or ku. Both are accepted.",
};

function digit(n: number): Digit {
  const d = DIGITS[n];
  if (!d) throw new Error(`No digit for ${n}`);
  return d;
}

function primary(n: number): string {
  return digit(n).readings[0]!;
}

function numberItem(set: SetId, value: number, jp: string, readings: string[], note?: string): Item {
  return { id: `${set}-${value}`, jp, readings, set, kind: "number", value, ...(note ? { note } : {}) };
}

function ones(): Item[] {
  return Object.keys(DIGITS).map((k) => {
    const n = Number(k);
    const d = digit(n);
    return numberItem("ones", n, d.jp, d.readings, ALT_NOTES[n]);
  });
}

// 11–99: tens + ones. A multiplier digit uses its primary reading; the ones digit
// accepts every reading it has on its own.
function teensTens(): Item[] {
  const items: Item[] = [];
  for (let n = 11; n <= 99; n++) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    const tensJp = t === 1 ? "十" : `${digit(t).jp}十`;
    const tensReading = t === 1 ? "juu" : `${primary(t)}juu`;
    const jp = o === 0 ? tensJp : `${tensJp}${digit(o).jp}`;
    const readings = o === 0 ? [tensReading] : digit(o).readings.map((r) => tensReading + r);
    const notes = [
      o === 0
        ? `${digit(t).jp} × 十 → ${tensReading}.`
        : `${tensJp} + ${digit(o).jp} → ${tensReading} + ${digit(o).readings[0]}. Say the tens, then the ones.`,
    ];
    if (ALT_NOTES[o]) notes.push(ALT_NOTES[o]!);
    items.push(numberItem("teens-tens", n, jp, readings, notes.join(" ")));
  }
  return items;
}

const HUNDRED_OVERRIDES: Record<number, { reading: string; note: string }> = {
  3: { reading: "sanbyaku", note: "三 + 百 → sanbyaku. The h-sound becomes b after 三." },
  6: { reading: "roppyaku", note: "六 + 百 → roppyaku. The h-sound becomes p after 六, 八 and 十." },
  8: { reading: "happyaku", note: "八 + 百 → happyaku. The h-sound becomes p after 六, 八 and 十." },
};

function hundreds(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const value = n * 100;
    if (n === 1) {
      items.push(numberItem("hundreds", value, "百", ["hyaku"], "百 on its own is hyaku — no ichi in front."));
      continue;
    }
    const o = HUNDRED_OVERRIDES[n];
    items.push(numberItem("hundreds", value, `${digit(n).jp}百`, [o ? o.reading : `${primary(n)}hyaku`], o?.note));
  }
  return items;
}

const THOUSAND_OVERRIDES: Record<number, { reading: string; note: string }> = {
  3: { reading: "sanzen", note: "三 + 千 → sanzen. The s-sound becomes z after 三." },
  8: { reading: "hassen", note: "八 + 千 → hassen. 八 shortens to a small pause before 千." },
};

function thousands(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const value = n * 1000;
    if (n === 1) {
      items.push(numberItem("thousands", value, "千", ["sen"], "千 on its own is sen — no ichi in front."));
      continue;
    }
    const o = THOUSAND_OVERRIDES[n];
    items.push(numberItem("thousands", value, `${digit(n).jp}千`, [o ? o.reading : `${primary(n)}sen`], o?.note));
  }
  return items;
}

function tenThousands(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const note = n === 1 ? "10,000 is always ichiman — never bare man." : undefined;
    items.push(numberItem("tenthousands", n * 10000, `${digit(n).jp}万`, [`${primary(n)}man`], note));
  }
  return items;
}

const NATIVE: [string, string][] = [
  ["ひとつ", "hitotsu"], ["ふたつ", "futatsu"], ["みっつ", "mittsu"], ["よっつ", "yottsu"],
  ["いつつ", "itsutsu"], ["むっつ", "muttsu"], ["ななつ", "nanatsu"], ["やっつ", "yattsu"],
  ["ここのつ", "kokonotsu"], ["とお", "too"],
];

function native(): Item[] {
  return NATIVE.map(([jp, reading], i) =>
    numberItem("native", i + 1, jp, [reading], i === 9 ? "とお (too) is the only native number without つ." : undefined),
  );
}

// ---- Time: verbatim table ---------------------------------------------------------

const HOURS: [string, string, string?][] = [
  ["一時", "ichiji"],
  ["二時", "niji"],
  ["三時", "sanji"],
  ["四時", "yoji", "四時 is yoji — never yonji."],
  ["五時", "goji"],
  ["六時", "rokuji"],
  ["七時", "shichiji", "七時 is shichiji."],
  ["八時", "hachiji"],
  ["九時", "kuji", "九時 is kuji — never kyuuji."],
  ["十時", "juuji"],
  ["十一時", "juuichiji"],
  ["十二時", "juuniji"],
];

const PUN = "分 (fun) becomes pun after 一, 三, 四, 六, 八 and 十.";

const MINUTES: [string, string[], string?][] = [
  ["一分", ["ippun"], `一 + 分 → ippun. ${PUN}`],
  ["二分", ["nifun"]],
  ["三分", ["sanpun"], `三 + 分 → sanpun. ${PUN}`],
  ["四分", ["yonpun"], `四 + 分 → yonpun. ${PUN}`],
  ["五分", ["gofun"]],
  ["六分", ["roppun"], `六 + 分 → roppun. ${PUN}`],
  ["七分", ["nanafun"]],
  ["八分", ["happun", "hachifun"], `八 + 分 → happun (hachifun is also heard). ${PUN}`],
  ["九分", ["kyuufun"]],
  ["十分", ["juppun", "jippun"], `十 + 分 → juppun or jippun. ${PUN}`],
];

const MODIFIERS: { id: string; jp: string; reading: string; set: SetId; note: string }[] = [
  { id: "han", jp: "半", reading: "han", set: "half", note: "半 (han) means half past: put it after the hour." },
  { id: "gozen", jp: "午前", reading: "gozen", set: "ampm", note: "午前 (gozen) means a.m. and goes before the time." },
  { id: "gogo", jp: "午後", reading: "gogo", set: "ampm", note: "午後 (gogo) means p.m. and goes before the time." },
  { id: "nanji", jp: "何時", reading: "nanji", set: "question", note: "何時 (nanji) asks what time — literally “what hour”." },
  { id: "nanpun", jp: "何分", reading: "nanpun", set: "question", note: "何分 (nanpun) asks how many minutes." },
];

function hours(): Item[] {
  return HOURS.map(([jp, reading, note], i) => ({
    id: `hours-${i + 1}`, jp, readings: [reading], set: "hours" as const, kind: "hour" as const, value: i + 1,
    ...(note ? { note } : {}),
  }));
}

function minutes(): Item[] {
  return MINUTES.map(([jp, readings, note], i) => ({
    id: `minutes-${i + 1}`, jp, readings, set: "minutes" as const, kind: "minute" as const, value: i + 1,
    ...(note ? { note } : {}),
  }));
}

function modifiers(): Item[] {
  return MODIFIERS.map((m) => ({
    id: `${m.set}-${m.id}`, jp: m.jp, readings: [m.reading], set: m.set, kind: "modifier" as const, note: m.note,
  }));
}

export const ITEMS: readonly Item[] = [
  ...ones(), ...teensTens(), ...hundreds(), ...thousands(), ...tenThousands(), ...native(),
  ...hours(), ...minutes(), ...modifiers(),
];

export const ITEMS_BY_ID: ReadonlyMap<string, Item> = new Map(ITEMS.map((i) => [i.id, i]));

export type SetInfo = { id: SetId; label: string; group: "numbers" | "time" };

export const SETS: readonly SetInfo[] = [
  { id: "ones", label: "1–10", group: "numbers" },
  { id: "teens-tens", label: "11–99", group: "numbers" },
  { id: "hundreds", label: "Hundreds", group: "numbers" },
  { id: "thousands", label: "Thousands", group: "numbers" },
  { id: "tenthousands", label: "Ten-thousands", group: "numbers" },
  { id: "native", label: "Native count", group: "numbers" },
  { id: "hours", label: "Hours", group: "time" },
  { id: "minutes", label: "Minutes", group: "time" },
  { id: "half", label: "Half past", group: "time" },
  { id: "ampm", label: "a.m. / p.m.", group: "time" },
  { id: "question", label: "What time?", group: "time" },
];

export function itemsInSets(sets: Iterable<SetId>): Item[] {
  const wanted = new Set(sets);
  return ITEMS.filter((i) => wanted.has(i.set));
}

export function itemsInSet(set: SetId): Item[] {
  return ITEMS.filter((i) => i.set === set);
}

/** Kanji numeral for 1–99, used to write clock prompts such as 二十五分. */
export function kanjiNumber(n: number): string {
  if (n < 1 || n > 99 || !Number.isInteger(n)) throw new Error(`kanjiNumber: ${n} out of range`);
  if (n <= 10) return digit(n).jp;
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${t === 1 ? "" : digit(t).jp}十${o === 0 ? "" : digit(o).jp}`;
}
