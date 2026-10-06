import { numberKana } from "./bignumbers";

/**
 * Tracing guides for the number kanji, in standard stroke order. Each stroke is a
 * polyline in a 0–100 box; the first point is where the stroke starts. These are
 * simplified skeletons for tracing, not font outlines.
 */
export type Point = readonly [number, number];
export type Stroke = readonly Point[];

export type KanjiGuide = {
  char: string;
  value: number;
  reading: string;
  strokes: readonly Stroke[];
  /**
   * The character's own reading in kana. Only needed where the composer cannot supply it:
   * 万 stands at 10,000, past `BUILD_MAX`, because a bare 万 is never a number — 10,000 is
   * 一万. Everything below that reads its kana from the dataset instead.
   */
  kana?: string;
  /** Shown under the pad when the character needs a caveat. */
  note?: string;
};

export const KANJI_GUIDES: readonly KanjiGuide[] = [
  { char: "一", value: 1, reading: "ichi", strokes: [[[14, 52], [86, 50]]] },
  {
    char: "二", value: 2, reading: "ni",
    strokes: [
      [[28, 32], [72, 31]],
      [[14, 70], [86, 69]],
    ],
  },
  {
    char: "三", value: 3, reading: "san",
    strokes: [
      [[24, 22], [76, 21]],
      [[30, 50], [70, 49]],
      [[14, 80], [86, 79]],
    ],
  },
  {
    char: "四", value: 4, reading: "yon",
    strokes: [
      [[20, 24], [20, 82]],
      [[20, 24], [80, 24], [80, 82]],
      [[41, 25], [40, 46], [31, 60]],
      [[58, 25], [58, 56], [63, 61], [78, 61]],
      [[20, 80], [80, 80]],
    ],
  },
  {
    char: "五", value: 5, reading: "go",
    strokes: [
      [[22, 20], [78, 20]],
      [[48, 20], [42, 48]],
      [[42, 48], [72, 48], [70, 82]],
      [[14, 82], [86, 82]],
    ],
  },
  {
    char: "六", value: 6, reading: "roku",
    strokes: [
      [[47, 13], [54, 24]],
      [[14, 36], [86, 36]],
      [[38, 52], [22, 80]],
      [[60, 52], [78, 78]],
    ],
  },
  {
    char: "七", value: 7, reading: "nana",
    strokes: [
      [[14, 46], [86, 38]],
      [[42, 16], [42, 74], [48, 82], [84, 82], [84, 72]],
    ],
  },
  {
    char: "八", value: 8, reading: "hachi",
    strokes: [
      [[40, 24], [38, 56], [18, 80]],
      [[60, 24], [66, 56], [86, 80]],
    ],
  },
  {
    char: "九", value: 9, reading: "kyuu",
    strokes: [
      [[42, 16], [40, 50], [18, 82]],
      [[16, 38], [64, 38], [60, 74], [66, 82], [86, 82], [86, 70]],
    ],
  },
  {
    char: "十", value: 10, reading: "juu",
    strokes: [
      [[12, 48], [88, 48]],
      [[50, 12], [50, 88]],
    ],
  },
  {
    char: "百", value: 100, reading: "hyaku",
    strokes: [
      [[14, 16], [86, 16]],
      [[50, 16], [42, 30]],
      [[26, 32], [26, 86]],
      [[26, 32], [74, 32], [74, 86]],
      [[26, 58], [74, 58]],
      [[26, 84], [74, 84]],
    ],
  },
  {
    char: "千", value: 1000, reading: "sen",
    strokes: [
      [[72, 12], [30, 26]],
      [[14, 46], [86, 46]],
      [[50, 22], [50, 90]],
    ],
  },
  {
    char: "万", value: 10000, reading: "man", kana: "まん",
    strokes: [
      [[14, 22], [86, 22]],
      [[46, 22], [20, 86]],
      [[34, 50], [76, 50], [70, 82], [54, 88]],
    ],
    note: "10,000 is always ichiman — 万 is never said bare.",
  },
];

/**
 * Hiragana tracing guides.
 *
 * Unlike the kanji, these carry no paths. Hiragana is full of curves that a polyline
 * skeleton renders badly, and a misshapen ghost teaches the wrong shape — so the ghost
 * is drawn from the real typeface glyph instead, which is correct by construction. All
 * that is stored per character is where each stroke begins, in order, for the numbered
 * dots, and the stroke count falls out of that list's length.
 *
 * Stroke counts follow what is taught in Japanese primary school. A few characters are
 * written with fewer strokes in some fonts and in casual handwriting — き (4, sometimes
 * joined into 3), さ (3, sometimes 2) and り (2, sometimes joined into 1) are the usual
 * ones — and the taught count is the one used here.
 */
export type KanaGuide = {
  char: string;
  reading: string;
  /** Where each stroke starts, in stroke order. Its length is the stroke count. */
  starts: readonly Point[];
};

const g = (char: string, reading: string, starts: readonly Point[]): KanaGuide => ({ char, reading, starts });

export const KANA_GUIDES: readonly KanaGuide[] = [
  g("あ", "a", [[26, 30], [54, 15], [74, 36]]),
  g("い", "i", [[32, 26], [72, 28]]),
  g("う", "u", [[42, 20], [32, 36]]),
  g("え", "e", [[42, 20], [30, 40]]),
  g("お", "o", [[24, 30], [52, 14], [80, 52]]),
  g("か", "ka", [[30, 24], [62, 16], [80, 30]]),
  g("き", "ki", [[28, 26], [26, 44], [60, 14], [34, 62]]),
  g("く", "ku", [[62, 20]]),
  g("け", "ke", [[26, 20], [56, 34], [74, 20]]),
  g("こ", "ko", [[30, 30], [28, 66]]),
  g("さ", "sa", [[30, 26], [60, 16], [30, 56]]),
  g("し", "shi", [[36, 18]]),
  g("す", "su", [[32, 28], [56, 16]]),
  g("せ", "se", [[28, 36], [50, 18], [30, 64]]),
  g("そ", "so", [[30, 24]]),
  g("た", "ta", [[26, 26], [52, 16], [64, 54], [64, 72]]),
  g("ち", "chi", [[30, 26], [58, 16]]),
  g("つ", "tsu", [[32, 30]]),
  g("て", "te", [[30, 26]]),
  g("と", "to", [[52, 20], [36, 52]]),
  g("な", "na", [[26, 28], [52, 16], [62, 52], [78, 62]]),
  g("に", "ni", [[28, 20], [60, 30], [58, 62]]),
  g("ぬ", "nu", [[28, 28], [56, 18]]),
  g("ね", "ne", [[30, 20], [58, 18]]),
  g("の", "no", [[66, 24]]),
  g("は", "ha", [[28, 20], [52, 34], [72, 22]]),
  g("ひ", "hi", [[28, 32]]),
  g("ふ", "fu", [[46, 18], [30, 46], [70, 40], [78, 62]]),
  g("へ", "he", [[26, 42]]),
  g("ほ", "ho", [[26, 18], [50, 30], [50, 58], [72, 22]]),
  g("ま", "ma", [[28, 28], [28, 52], [56, 16]]),
  g("み", "mi", [[32, 24], [62, 56]]),
  g("む", "mu", [[28, 30], [52, 18], [70, 66]]),
  g("め", "me", [[28, 26], [56, 18]]),
  g("も", "mo", [[52, 16], [28, 38], [28, 58]]),
  g("や", "ya", [[30, 30], [56, 20], [54, 46]]),
  g("ゆ", "yu", [[36, 24], [62, 16]]),
  g("よ", "yo", [[30, 26], [52, 16]]),
  g("ら", "ra", [[36, 20], [62, 40]]),
  g("り", "ri", [[34, 20], [66, 18]]),
  g("る", "ru", [[30, 24]]),
  g("れ", "re", [[30, 20], [58, 18]]),
  g("ろ", "ro", [[30, 24]]),
  g("わ", "wa", [[30, 20], [58, 18]]),
  g("を", "wo", [[30, 24], [52, 16], [46, 60]]),
  g("ん", "n", [[34, 26]]),
];

/**
 * What the tracing pad needs, from either source. `strokes` present means draw the ghost
 * from those paths; absent means draw the character's own glyph.
 */
export type TraceGuide = {
  char: string;
  reading: string;
  /**
   * The reading in kana, for the synthesiser. A bare kanji is ambiguous out loud — 四
   * alone may come back as shi rather than yon — so the sound is always driven from kana.
   */
  kana: string;
  strokes?: readonly Stroke[];
  starts: readonly Point[];
  note?: string;
};

export const kanjiTrace = (k: KanjiGuide): TraceGuide => ({
  char: k.char,
  reading: k.reading,
  // The composer knows every reading below 万; only 万 itself has to carry its own.
  kana: k.kana ?? numberKana(k.value),
  strokes: k.strokes,
  starts: k.strokes.map((s) => s[0]!),
  ...(k.note ? { note: k.note } : {}),
});

export const kanaTrace = (k: KanaGuide): TraceGuide => ({
  char: k.char,
  reading: k.reading,
  // A kana character is already its own reading.
  kana: k.char,
  starts: k.starts,
});
