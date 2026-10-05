import type { Item, SetId } from "./types";

/*
 * Number items are generated from the rules in CLAUDE.md. Time items are irregular and
 * copied verbatim from the table there — never derive them.
 */

type Digit = { jp: string; readings: string[]; kana: string[] };

// 1–10. The first reading is the primary one, used when the digit is a multiplier.
const DIGITS: Record<number, Digit> = {
  1: { jp: "一", readings: ["ichi"], kana: ["いち"] },
  2: { jp: "二", readings: ["ni"], kana: ["に"] },
  3: { jp: "三", readings: ["san"], kana: ["さん"] },
  4: { jp: "四", readings: ["yon", "shi"], kana: ["よん", "し"] },
  5: { jp: "五", readings: ["go"], kana: ["ご"] },
  6: { jp: "六", readings: ["roku"], kana: ["ろく"] },
  7: { jp: "七", readings: ["nana", "shichi"], kana: ["なな", "しち"] },
  8: { jp: "八", readings: ["hachi"], kana: ["はち"] },
  9: { jp: "九", readings: ["kyuu", "ku"], kana: ["きゅう", "く"] },
  10: { jp: "十", readings: ["juu"], kana: ["じゅう"] },
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

function primaryKana(n: number): string {
  return digit(n).kana[0]!;
}

function numberItem(set: SetId, value: number, jp: string, readings: string[], kana: string[], note?: string): Item {
  return { id: `${set}-${value}`, jp, readings, kana, set, kind: "number", value, ...(note ? { note } : {}) };
}

function ones(): Item[] {
  return Object.keys(DIGITS).map((k) => {
    const n = Number(k);
    const d = digit(n);
    return numberItem("ones", n, d.jp, d.readings, d.kana, ALT_NOTES[n]);
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
    const tensKana = t === 1 ? "じゅう" : `${primaryKana(t)}じゅう`;
    const jp = o === 0 ? tensJp : `${tensJp}${digit(o).jp}`;
    const readings = o === 0 ? [tensReading] : digit(o).readings.map((r) => tensReading + r);
    const kana = o === 0 ? [tensKana] : digit(o).kana.map((k) => tensKana + k);
    const notes = [
      o === 0
        ? `${digit(t).jp} × 十 → ${tensReading}.`
        : `${tensJp} + ${digit(o).jp} → ${tensReading} + ${digit(o).readings[0]}. Say the tens, then the ones.`,
    ];
    if (ALT_NOTES[o]) notes.push(ALT_NOTES[o]!);
    items.push(numberItem("teens-tens", n, jp, readings, kana, notes.join(" ")));
  }
  return items;
}

const HUNDRED_OVERRIDES: Record<number, { reading: string; kana: string; note: string }> = {
  3: { reading: "sanbyaku", kana: "さんびゃく", note: "三 + 百 → sanbyaku. The h-sound becomes b after 三." },
  6: { reading: "roppyaku", kana: "ろっぴゃく", note: "六 + 百 → roppyaku. The h-sound becomes p after 六, 八 and 十." },
  8: { reading: "happyaku", kana: "はっぴゃく", note: "八 + 百 → happyaku. The h-sound becomes p after 六, 八 and 十." },
};

function hundreds(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const value = n * 100;
    if (n === 1) {
      items.push(numberItem("hundreds", value, "百", ["hyaku"], ["ひゃく"], "百 on its own is hyaku — no ichi in front."));
      continue;
    }
    const o = HUNDRED_OVERRIDES[n];
    items.push(numberItem("hundreds", value, `${digit(n).jp}百`, [o ? o.reading : `${primary(n)}hyaku`], [o ? o.kana : `${primaryKana(n)}ひゃく`], o?.note));
  }
  return items;
}

const THOUSAND_OVERRIDES: Record<number, { reading: string; kana: string; note: string }> = {
  3: { reading: "sanzen", kana: "さんぜん", note: "三 + 千 → sanzen. The s-sound becomes z after 三." },
  8: { reading: "hassen", kana: "はっせん", note: "八 + 千 → hassen. 八 shortens to a small pause before 千." },
};

function thousands(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const value = n * 1000;
    if (n === 1) {
      items.push(numberItem("thousands", value, "千", ["sen"], ["せん"], "千 on its own is sen — no ichi in front."));
      continue;
    }
    const o = THOUSAND_OVERRIDES[n];
    items.push(numberItem("thousands", value, `${digit(n).jp}千`, [o ? o.reading : `${primary(n)}sen`], [o ? o.kana : `${primaryKana(n)}せん`], o?.note));
  }
  return items;
}

function tenThousands(): Item[] {
  const items: Item[] = [];
  for (let n = 1; n <= 9; n++) {
    const note = n === 1 ? "10,000 is always ichiman — never bare man." : undefined;
    items.push(numberItem("tenthousands", n * 10000, `${digit(n).jp}万`, [`${primary(n)}man`], [`${primaryKana(n)}まん`], note));
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
    // The native words are written in kana already, so jp is its own reading.
    numberItem("native", i + 1, jp, [reading], [jp], i === 9 ? "とお (too) is the only native number without つ." : undefined),
  );
}

// ---- Time: verbatim table ---------------------------------------------------------

const HOURS: [string, string, string, string?][] = [
  ["一時", "ichiji", "いちじ"],
  ["二時", "niji", "にじ"],
  ["三時", "sanji", "さんじ"],
  ["四時", "yoji", "よじ", "四時 is yoji — never yonji."],
  ["五時", "goji", "ごじ"],
  ["六時", "rokuji", "ろくじ"],
  ["七時", "shichiji", "しちじ", "七時 is shichiji."],
  ["八時", "hachiji", "はちじ"],
  ["九時", "kuji", "くじ", "九時 is kuji — never kyuuji."],
  ["十時", "juuji", "じゅうじ"],
  ["十一時", "juuichiji", "じゅういちじ"],
  ["十二時", "juuniji", "じゅうにじ"],
];

const PUN = "分 (fun) becomes pun after 一, 三, 四, 六, 八 and 十.";

const MINUTES: [string, string[], string[], string?][] = [
  ["一分", ["ippun"], ["いっぷん"], `一 + 分 → ippun. ${PUN}`],
  ["二分", ["nifun"], ["にふん"]],
  ["三分", ["sanpun"], ["さんぷん"], `三 + 分 → sanpun. ${PUN}`],
  ["四分", ["yonpun"], ["よんぷん"], `四 + 分 → yonpun. ${PUN}`],
  ["五分", ["gofun"], ["ごふん"]],
  ["六分", ["roppun"], ["ろっぷん"], `六 + 分 → roppun. ${PUN}`],
  ["七分", ["nanafun"], ["ななふん"]],
  ["八分", ["happun", "hachifun"], ["はっぷん", "はちふん"], `八 + 分 → happun (hachifun is also heard). ${PUN}`],
  ["九分", ["kyuufun"], ["きゅうふん"]],
  ["十分", ["juppun", "jippun"], ["じゅっぷん", "じっぷん"], `十 + 分 → juppun or jippun. ${PUN}`],
];

const MODIFIERS: { id: string; jp: string; reading: string; kana: string; set: SetId; note: string }[] = [
  { id: "han", jp: "半", reading: "han", kana: "はん", set: "half", note: "半 (han) means half past: put it after the hour." },
  { id: "gozen", jp: "午前", reading: "gozen", kana: "ごぜん", set: "ampm", note: "午前 (gozen) means a.m. and goes before the time." },
  { id: "gogo", jp: "午後", reading: "gogo", kana: "ごご", set: "ampm", note: "午後 (gogo) means p.m. and goes before the time." },
  { id: "nanji", jp: "何時", reading: "nanji", kana: "なんじ", set: "question", note: "何時 (nanji) asks what time — literally “what hour”." },
  { id: "nanpun", jp: "何分", reading: "nanpun", kana: "なんぷん", set: "question", note: "何分 (nanpun) asks how many minutes." },
];

function hours(): Item[] {
  return HOURS.map(([jp, reading, kana, note], i) => ({
    id: `hours-${i + 1}`, jp, readings: [reading], kana: [kana], set: "hours" as const, kind: "hour" as const, value: i + 1,
    ...(note ? { note } : {}),
  }));
}

function minutes(): Item[] {
  return MINUTES.map(([jp, readings, kana, note], i) => ({
    id: `minutes-${i + 1}`, jp, readings, kana, set: "minutes" as const, kind: "minute" as const, value: i + 1,
    ...(note ? { note } : {}),
  }));
}

function modifiers(): Item[] {
  return MODIFIERS.map((m) => ({
    id: `${m.set}-${m.id}`, jp: m.jp, readings: [m.reading], kana: [m.kana], set: m.set, kind: "modifier" as const, note: m.note,
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
