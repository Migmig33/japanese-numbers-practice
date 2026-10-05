import type { Difficulty } from "./modes";
import { ROUND_LENGTH } from "./srs";

/*
 * The hiragana syllabary: 46 basic characters, 25 with a dakuten or handakuten, and 33
 * combinations. Romaji is Hepburn, which is what dictionaries and signposting use —
 * し is shi rather than si, ち is chi, つ is tsu.
 *
 * ぢ and づ are in the chart for completeness but never in a round: they are said the
 * same as じ and ず, so a question asking which kana makes "ji" would have two right
 * answers. The same reasoning keeps へ away from に in the particle quiz.
 */

export type Kana = {
  kana: string;
  romaji: string;
  /** Extra spellings accepted when typing. */
  also?: string[];
  /** Which consonant row it belongs to: a, k, s, t, n, h, m, y, r, w. */
  row: string;
  /** The vowel it ends on, for grouping the chart. */
  vowel: string;
  group: "basic" | "dakuten" | "combo";
  /** Why it is easy to get wrong, when it is. */
  note?: string;
};

const k = (kana: string, romaji: string, row: string, vowel: string, group: Kana["group"], note?: string, also?: string[]): Kana => ({
  kana, romaji, row, vowel, group, ...(note ? { note } : {}), ...(also ? { also } : {}),
});

export const BASIC: readonly Kana[] = [
  k("あ", "a", "a", "a", "basic", "あ and お are the classic mix-up: あ has a cross, お has a hook and a dot."),
  k("い", "i", "a", "i", "basic"),
  k("う", "u", "a", "u", "basic", "う and つ look alike; つ is a single sweeping stroke."),
  k("え", "e", "a", "e", "basic"),
  k("お", "o", "a", "o", "basic", "お has a dot on the right; あ does not."),
  k("か", "ka", "k", "a", "basic"),
  k("き", "ki", "k", "i", "basic", "き and さ both curve left; き has two crossbars."),
  k("く", "ku", "k", "u", "basic"),
  k("け", "ke", "k", "e", "basic"),
  k("こ", "ko", "k", "o", "basic"),
  k("さ", "sa", "s", "a", "basic", "さ has one crossbar, き has two."),
  k("し", "shi", "s", "i", "basic", "Hepburn writes し as shi, never si."),
  k("す", "su", "s", "u", "basic"),
  k("せ", "se", "s", "e", "basic"),
  k("そ", "so", "s", "o", "basic"),
  k("た", "ta", "t", "a", "basic"),
  k("ち", "chi", "t", "i", "basic", "ち is chi, not ti. It is さ mirrored."),
  k("つ", "tsu", "t", "u", "basic", "つ is tsu, not tu. A small っ doubles the next consonant."),
  k("て", "te", "t", "e", "basic"),
  k("と", "to", "t", "o", "basic"),
  k("な", "na", "n", "a", "basic"),
  k("に", "ni", "n", "i", "basic"),
  k("ぬ", "nu", "n", "u", "basic", "ぬ and め differ by the loop: ぬ has one, め does not."),
  k("ね", "ne", "n", "e", "basic", "ね, れ and わ share a stem; only ね ends in a loop."),
  k("の", "no", "n", "o", "basic"),
  k("は", "ha", "h", "a", "basic", "As a particle は is said wa, but on its own it is ha."),
  k("ひ", "hi", "h", "i", "basic"),
  k("ふ", "fu", "h", "u", "basic", "ふ is fu, somewhere between f and h."),
  k("へ", "he", "h", "e", "basic", "As a particle へ is said e, but on its own it is he."),
  k("ほ", "ho", "h", "o", "basic", "ほ is は with an extra bar."),
  k("ま", "ma", "m", "a", "basic"),
  k("み", "mi", "m", "i", "basic"),
  k("む", "mu", "m", "u", "basic"),
  k("め", "me", "m", "e", "basic", "め has no loop; ぬ does."),
  k("も", "mo", "m", "o", "basic"),
  k("や", "ya", "y", "a", "basic"),
  k("ゆ", "yu", "y", "u", "basic"),
  k("よ", "yo", "y", "o", "basic"),
  k("ら", "ra", "r", "a", "basic"),
  k("り", "ri", "r", "i", "basic"),
  k("る", "ru", "r", "u", "basic", "る is closed at the bottom, ろ is open."),
  k("れ", "re", "r", "e", "basic"),
  k("ろ", "ro", "r", "o", "basic", "ろ has no loop; る does."),
  k("わ", "wa", "w", "a", "basic", "わ, ね and れ look alike — わ ends in a short hook."),
  k("を", "wo", "w", "o", "basic", "Only ever used as the object particle, and said o.", ["o"]),
  k("ん", "n", "n", "-", "basic", "The only kana that is a consonant on its own."),
];

export const DAKUTEN: readonly Kana[] = [
  k("が", "ga", "g", "a", "dakuten"), k("ぎ", "gi", "g", "i", "dakuten"), k("ぐ", "gu", "g", "u", "dakuten"),
  k("げ", "ge", "g", "e", "dakuten"), k("ご", "go", "g", "o", "dakuten"),
  k("ざ", "za", "z", "a", "dakuten"), k("じ", "ji", "z", "i", "dakuten", "じ is ji, not zi."),
  k("ず", "zu", "z", "u", "dakuten"), k("ぜ", "ze", "z", "e", "dakuten"), k("ぞ", "zo", "z", "o", "dakuten"),
  k("だ", "da", "d", "a", "dakuten"),
  k("ぢ", "ji", "d", "i", "dakuten", "Said the same as じ, and rare. Left out of the quiz for that reason.", ["di"]),
  k("づ", "zu", "d", "u", "dakuten", "Said the same as ず, and rare. Left out of the quiz for that reason.", ["du"]),
  k("で", "de", "d", "e", "dakuten"), k("ど", "do", "d", "o", "dakuten"),
  k("ば", "ba", "b", "a", "dakuten"), k("び", "bi", "b", "i", "dakuten"), k("ぶ", "bu", "b", "u", "dakuten"),
  k("べ", "be", "b", "e", "dakuten"), k("ぼ", "bo", "b", "o", "dakuten"),
  k("ぱ", "pa", "p", "a", "dakuten", "A small circle, not two strokes: ぱ is pa, ば is ba."),
  k("ぴ", "pi", "p", "i", "dakuten"), k("ぷ", "pu", "p", "u", "dakuten"),
  k("ぺ", "pe", "p", "e", "dakuten"), k("ぽ", "po", "p", "o", "dakuten"),
];

export const COMBO: readonly Kana[] = [
  k("きゃ", "kya", "k", "a", "combo"), k("きゅ", "kyu", "k", "u", "combo"), k("きょ", "kyo", "k", "o", "combo"),
  k("しゃ", "sha", "s", "a", "combo", "しゃ is sha, not sya."), k("しゅ", "shu", "s", "u", "combo"), k("しょ", "sho", "s", "o", "combo"),
  k("ちゃ", "cha", "t", "a", "combo", "ちゃ is cha, not tya."), k("ちゅ", "chu", "t", "u", "combo"), k("ちょ", "cho", "t", "o", "combo"),
  k("にゃ", "nya", "n", "a", "combo"), k("にゅ", "nyu", "n", "u", "combo"), k("にょ", "nyo", "n", "o", "combo"),
  k("ひゃ", "hya", "h", "a", "combo"), k("ひゅ", "hyu", "h", "u", "combo"), k("ひょ", "hyo", "h", "o", "combo"),
  k("みゃ", "mya", "m", "a", "combo"), k("みゅ", "myu", "m", "u", "combo"), k("みょ", "myo", "m", "o", "combo"),
  k("りゃ", "rya", "r", "a", "combo"), k("りゅ", "ryu", "r", "u", "combo"), k("りょ", "ryo", "r", "o", "combo"),
  k("ぎゃ", "gya", "g", "a", "combo"), k("ぎゅ", "gyu", "g", "u", "combo"), k("ぎょ", "gyo", "g", "o", "combo"),
  k("じゃ", "ja", "z", "a", "combo", "じゃ is ja, not jya."), k("じゅ", "ju", "z", "u", "combo"), k("じょ", "jo", "z", "o", "combo"),
  k("びゃ", "bya", "b", "a", "combo"), k("びゅ", "byu", "b", "u", "combo"), k("びょ", "byo", "b", "o", "combo"),
  k("ぴゃ", "pya", "p", "a", "combo"), k("ぴゅ", "pyu", "p", "u", "combo"), k("ぴょ", "pyo", "p", "o", "combo"),
];

export const ALL_KANA: readonly Kana[] = [...BASIC, ...DAKUTEN, ...COMBO];

/** ぢ and づ duplicate じ and ず, so a question about them would have two right answers. */
export const AMBIGUOUS = new Set(["ぢ", "づ"]);
export const quizzable = (x: Kana) => !AMBIGUOUS.has(x.kana);

/** The chart, laid out the way it is normally printed: rows of five. */
export const VOWELS = ["a", "i", "u", "e", "o"] as const;
export const BASIC_ROWS = ["a", "k", "s", "t", "n", "h", "m", "y", "r", "w"] as const;
export const DAKUTEN_ROWS = ["g", "z", "d", "b", "p"] as const;
export const COMBO_ROWS = ["k", "s", "t", "n", "h", "m", "r", "g", "z", "b", "p"] as const;

/** Combinations only exist on the a, u and o vowels. */
export const COMBO_VOWELS = ["a", "u", "o"] as const;

export function rowOf(source: readonly Kana[], row: string, vowels: readonly string[] = VOWELS): (Kana | null)[] {
  return vowels.map((v) => source.find((x) => x.row === row && x.vowel === v) ?? null);
}

// ---- Quiz --------------------------------------------------------------------------

export const HIRAGANA_MODE_IDS = ["kana-read", "kana-find", "kana-type"] as const;
export type HiraganaModeId = (typeof HIRAGANA_MODE_IDS)[number];

export type HiraganaMode = {
  id: HiraganaModeId;
  difficulty: Difficulty;
  name: string;
  task: string;
  blurb: string;
  sample: string;
};

export const HIRAGANA_MODES: Record<HiraganaModeId, HiraganaMode> = {
  "kana-read": {
    id: "kana-read",
    difficulty: "Easy",
    name: "Read it",
    task: "Pick the sound the character makes",
    blurb: "A character and four sounds. Start here — this is the one that builds recognition.",
    sample: "し → shi",
  },
  "kana-find": {
    id: "kana-find",
    difficulty: "Medium",
    name: "Find it",
    task: "Pick the character for the sound",
    blurb: "The other way round, which is harder: you have to tell the look-alikes apart.",
    sample: "nu → ぬ",
  },
  "kana-type": {
    id: "kana-type",
    difficulty: "Hard",
    name: "Type it",
    task: "Type the sound",
    blurb: "No options at all. This is the one that tells you whether you really know them.",
    sample: "ちょ → cho",
  },
};

export type KanaSet = "basic" | "dakuten" | "combo";

export type KanaQuestion = {
  id: string;
  item: Kana;
  /** Four choices: romaji for "read", characters for "find". */
  options?: string[];
};

const shuffle = <T,>(xs: readonly T[], rng: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

export function kanaPool(sets: readonly KanaSet[]): Kana[] {
  const wanted = new Set(sets.length ? sets : (["basic"] as KanaSet[]));
  return ALL_KANA.filter((x) => wanted.has(x.group) && quizzable(x));
}

/**
 * Wrong answers worth offering: the same consonant row first, so the question tests the
 * vowel, then the same vowel, which catches the look-alikes.
 */
export function kanaOptions(item: Kana, pool: readonly Kana[], mode: HiraganaModeId, rng: () => number = Math.random, count = 4): string[] {
  const show = (x: Kana) => (mode === "kana-find" ? x.kana : x.romaji);
  const right = show(item);
  const near = pool.filter((x) => x.kana !== item.kana && x.row === item.row);
  const sameVowel = pool.filter((x) => x.kana !== item.kana && x.vowel === item.vowel && x.row !== item.row);
  const rest = pool.filter((x) => x.kana !== item.kana);

  const wrong: string[] = [];
  for (const group of [near, sameVowel, rest]) {
    for (const x of shuffle(group, rng)) {
      const label = show(x);
      if (wrong.length >= count - 1) break;
      if (label !== right && !wrong.includes(label)) wrong.push(label);
    }
  }
  return shuffle([right, ...wrong], rng);
}

export function buildKanaRound(
  mode: HiraganaModeId,
  { sets = ["basic"] as KanaSet[], length = ROUND_LENGTH }: { sets?: KanaSet[]; length?: number } = {},
  rng: () => number = Math.random,
): KanaQuestion[] {
  const pool = kanaPool(sets);
  const picked = shuffle(pool, rng).slice(0, Math.min(length, pool.length));
  return picked.map((item) => ({
    id: `${mode}-${item.kana}`,
    item,
    ...(mode === "kana-type" ? {} : { options: kanaOptions(item, pool, mode, rng) }),
  }));
}

export function checkKanaAnswer(q: KanaQuestion, mode: HiraganaModeId, given: string | null): boolean {
  if (!given) return false;
  if (mode === "kana-find") return given === q.item.kana;
  const typed = given.trim().toLowerCase().replace(/\s+/g, "");
  return typed === q.item.romaji || (q.item.also?.includes(typed) ?? false);
}
