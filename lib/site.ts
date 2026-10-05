import type { Metadata } from "next";

/** Set NEXT_PUBLIC_SITE_URL at build time; canonical URLs and the sitemap use it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sennin.site").replace(/\/+$/, "");
export const SITE_NAME = "Sennin";
export const DEVELOPER = "kupdevs";
/** Change this to a real inbox before launch; the legal pages point people here. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "kupdevs@gmail.com";
export const LAUNCH_YEAR = 2026;

export type PageKey =
  | "home" | "hiragana" | "numbers" | "time" | "writing" | "particles" | "progress"
  | "about" | "contact" | "privacy" | "terms";

export type PageInfo = {
  path: string;
  nav: string;
  /** Breadcrumb and card title. */
  name: string;
  title: string;
  description: string;
  blurb: string;
  glyph: string;
};

export const PAGES: Record<PageKey, PageInfo> = {
  home: {
    path: "/",
    nav: "Home",
    name: "Home",
    title: "Sennin — Free Japanese Quizzes: Numbers, Time, Kanji and Particles",
    description:
      "Free Japanese practice with instant feedback: read numbers up to 十億, tell the time, trace number kanji, and learn the particles は, が, を, に and で. No sign-up.",
    blurb: "",
    glyph: "仙",
  },
  hiragana: {
    path: "/hiragana",
    nav: "Hiragana",
    name: "Hiragana",
    title: "Hiragana Chart and Quiz — Learn All 46 Characters",
    description:
      "The full hiragana chart with sounds, the look-alikes that cost beginners time, and three quizzes: read it, find it, or type it from memory.",
    blurb: "The full chart, the look-alikes, and three quizzes.",
    glyph: "あ",
  },
  numbers: {
    path: "/japanese-numbers-quiz",
    nav: "Numbers",
    name: "Japanese numbers quiz",
    title: "Japanese Numbers Quiz — Build, Read and Say 1 to a Thousand Million",
    description:
      "Free Japanese numbers quiz, three ways: build numbers from kanji, read them back, or type the reading — 一 to 十億, with roppyaku, sanzen, 万 and 億 explained as you go.",
    blurb: "Three ways to practise, from 一 to 十億, every sound change explained.",
    glyph: "六百",
  },
  time: {
    path: "/telling-time-in-japanese",
    nav: "Time",
    name: "Telling time in Japanese",
    title: "Telling Time in Japanese — Hours, Minutes and Clock Quiz",
    description:
      "Practice telling time in Japanese three ways: pick the time a clock phrase means, drag the hands to match, or type the reading — yoji, kuji, ippun, juppun, han, gozen and gogo.",
    blurb: "Three ways to practise: read it, set the clock, or say it.",
    glyph: "四時",
  },
  writing: {
    path: "/japanese-number-kanji-writing",
    nav: "Writing",
    name: "Japanese number kanji writing",
    title: "Write Japanese Number Kanji — Stroke Order and Tracing Practice",
    description:
      "Trace the Japanese number kanji 一 to 十, 百 and 千 with numbered stroke starts and a stroke counter, plus a chart of how they combine into whole numbers.",
    blurb: "Trace 一 to 十, 百 and 千 stroke by stroke.",
    glyph: "九",
  },
  particles: {
    path: "/japanese-particles",
    nav: "Particles",
    name: "Japanese particles",
    title: "Japanese Particles — は, が, を, に, で Explained, with a Quiz",
    description:
      "What every beginner particle does, with short example sentences and two quizzes: fill the gap, or build the sentence piece by piece.",
    blurb: "は, が, を, に, で — what each one does, with a quiz.",
    glyph: "は",
  },
  about: {
    path: "/about",
    nav: "About",
    name: "About Sennin",
    title: "About Sennin — Who Makes It and How the Japanese Is Checked",
    description:
      "Why Sennin exists, how its readings are prepared and checked, what it deliberately leaves out, and who builds it.",
    blurb: "Why the site exists and how it is made.",
    glyph: "仙人",
  },
  contact: {
    path: "/contact",
    nav: "Contact",
    name: "Contact",
    title: "Contact Sennin — Corrections, Bugs and Questions",
    description:
      "How to reach the person who builds Sennin: corrections to a reading, bug reports, suggestions and questions about the site.",
    blurb: "Corrections, bugs and questions.",
    glyph: "文",
  },
  privacy: {
    path: "/privacy-policy",
    nav: "Privacy",
    name: "Privacy policy",
    title: "Privacy Policy — Sennin",
    description: "What Sennin stores, what it doesn't, and the choices you have. No accounts, no tracking profiles.",
    blurb: "What we store, what we don't.",
    glyph: "私",
  },
  terms: {
    path: "/terms",
    nav: "Terms",
    name: "Terms and conditions",
    title: "Terms and Conditions — Sennin",
    description: "The terms for using Sennin's free Japanese quizzes.",
    blurb: "The terms for using this site.",
    glyph: "約",
  },
  progress: {
    path: "/progress",
    nav: "Progress",
    name: "Your progress",
    title: "Your Progress — Sennin",
    description: "Your Japanese numbers practice stats, streak calendar and mastery heatmap, stored only in this browser.",
    blurb: "Your stats, streak calendar and mastery heatmap.",
    glyph: "百",
  },
};

export const NAV: PageKey[] = ["hiragana", "numbers", "time", "particles", "writing", "progress"];

export function pageMetadata(key: PageKey, extra: Partial<Metadata> = {}): Metadata {
  const p = PAGES[key];
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, siteName: SITE_NAME, type: "website" },
    ...extra,
  };
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
