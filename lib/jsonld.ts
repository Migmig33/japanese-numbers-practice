import { absoluteUrl, PAGES, SITE_NAME, type PageKey } from "./site";

export function quizJsonLd(page: PageKey, about: string[]): Record<string, unknown> {
  const p = PAGES[page];
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: p.title,
    description: p.description,
    url: absoluteUrl(p.path),
    inLanguage: "en",
    educationalLevel: "Beginner",
    learningResourceType: "Quiz",
    isAccessibleForFree: true,
    about: about.map((name) => ({ "@type": "Thing", name })),
    provider: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  };
}
