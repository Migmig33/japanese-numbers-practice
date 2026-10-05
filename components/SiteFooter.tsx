import Link from "next/link";
import { PAGES } from "@/lib/site";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Quizzes",
    links: [
      { label: "Japanese numbers quiz", href: PAGES.numbers.path },
      { label: "Telling time in Japanese", href: PAGES.time.path },
      { label: "Number kanji writing", href: PAGES.writing.path },
    ],
  },
  {
    heading: "Reference",
    links: [
      { label: "Numbers chart", href: `${PAGES.numbers.path}#reference` },
      { label: "Hours and minutes chart", href: `${PAGES.time.path}#reference` },
      { label: "Kanji stroke counts", href: `${PAGES.writing.path}#reference` },
    ],
  },
  {
    heading: "Your practice",
    links: [
      { label: "Progress and stats", href: PAGES.progress.path },
      { label: "Items to review", href: `${PAGES.progress.path}#review` },
    ],
  },
  {
    heading: "Sennin",
    links: [
      { label: "Home", href: "/" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-hairline bg-card">
      <div className="mx-auto grid max-w-page grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="mb-3 font-sans text-[15px] font-bold tracking-wide text-muted uppercase">{col.heading}</h2>
            <ul className="space-y-2 text-[15px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto max-w-page px-4 pb-10 text-[14px] text-muted">
        Sennin is free and ad-supported. Your progress is saved only in this browser.
      </p>
    </footer>
  );
}
