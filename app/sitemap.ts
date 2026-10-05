import type { MetadataRoute } from "next";
import { absoluteUrl, PAGES, type PageKey } from "@/lib/site";

export const dynamic = "force-static";

const INDEXED: { key: PageKey; priority: number }[] = [
  { key: "home", priority: 1 },
  { key: "hiragana", priority: 0.9 },
  { key: "numbers", priority: 0.9 },
  { key: "time", priority: 0.9 },
  { key: "writing", priority: 0.8 },
  { key: "particles", priority: 0.9 },
  { key: "about", priority: 0.5 },
  { key: "contact", priority: 0.4 },
  { key: "privacy", priority: 0.3 },
  { key: "terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED.map(({ key, priority }) => ({
    url: absoluteUrl(PAGES[key].path),
    changeFrequency: "monthly",
    priority,
  }));
}
