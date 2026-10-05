import type { Metadata } from "next";

/** Set NEXT_PUBLIC_SITE_URL at build time; canonical URLs and the sitemap use it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sennin.app").replace(/\/+$/, "");
export const SITE_NAME = "Sennin";
export const DEVELOPER = "kupdevs";
/** Change this to a real inbox before launch; the legal pages point people here. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "kupdevs@gmail.com";
export const LAUNCH_YEAR = 2026;

export type PageKey = "home" | "numbers" | "time" | "writing" | "progress" | "privacy" | "terms";

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
    title: "Sennin — Free Japanese Numbers and Telling Time Quizzes",
    description:
      "Learn to read Japanese numbers and tell time with free quick-fire quizzes, kanji tracing and clear rules for every tricky sound change. No sign-up.",
    blurb: "",
    glyph: "仙",
  },
  numbers: {
    path: "/japanese-numbers-quiz",
    nav: "Numbers",
    name: "Japanese numbers quiz",
    title: "Japanese Numbers Quiz — Practice 1 to 90,000 Online",
    description:
      "Free Japanese numbers quiz: type the reading of 一 to 九万, including roppyaku, sanzen and the native hitotsu, futatsu series. Instant feedback and the rule behind every miss.",
    blurb: "Read kanji numbers from one to ninety thousand, with every sound change explained.",
    glyph: "六百",
  },
  time: {
    path: "/telling-time-in-japanese",
    nav: "Time",
    name: "Telling time in Japanese",
    title: "Telling Time in Japanese — Hours, Minutes and Clock Quiz",
    description:
      "Practice telling time in Japanese: yoji, kuji, ippun, juppun, han, gozen and gogo. Type the readings, then set a clock to Japanese times.",
    blurb: "Hours, minutes, half past, a.m. and p.m. — then set the clock yourself.",
    glyph: "四時",
  },
  writing: {
    path: "/japanese-number-kanji-writing",
    nav: "Writing",
    name: "Japanese number kanji writing",
    title: "Write Japanese Numbers in Kanji — Build and Trace Practice",
    description:
      "Practise writing Japanese numbers: see a number like 102, build it as 百二 from kanji or romaji tiles, then trace 一 to 十, 百 and 千 with numbered stroke starts.",
    blurb: "Build numbers like 102 from kanji tiles, then trace each character.",
    glyph: "九",
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
    description: "The terms for using Sennin's free Japanese numbers and telling-time quizzes.",
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

export const NAV: PageKey[] = ["numbers", "time", "writing", "progress"];

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
