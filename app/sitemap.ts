import type { MetadataRoute } from "next";
import { absoluteUrl, PAGES, type PageKey } from "@/lib/site";

export const dynamic = "force-static";

const INDEXED: { key: PageKey; priority: number }[] = [
  { key: "home", priority: 1 },
  { key: "numbers", priority: 0.9 },
  { key: "time", priority: 0.9 },
  { key: "writing", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED.map(({ key, priority }) => ({
    url: absoluteUrl(PAGES[key].path),
    changeFrequency: "monthly",
    priority,
  }));
}
