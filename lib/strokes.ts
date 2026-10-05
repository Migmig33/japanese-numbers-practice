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
];
