import Link from "next/link";
import { DEVELOPER, LAUNCH_YEAR, PAGES, SITE_NAME } from "@/lib/site";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Quizzes",
    links: [
      { label: "Japanese numbers quiz", href: PAGES.numbers.path },
      { label: "Telling time in Japanese", href: PAGES.time.path },
      { label: "Number kanji writing", href: PAGES.writing.path },
      { label: PAGES.particles.name, href: PAGES.particles.path },
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
      { label: PAGES.privacy.name, href: PAGES.privacy.path },
      { label: PAGES.terms.name, href: PAGES.terms.path },
    ],
  },
];

export function SiteFooter() {
  // Fixed at build time; a rebuild each year keeps it current.
  const built = new Date().getFullYear();
  const year = built > LAUNCH_YEAR ? `${LAUNCH_YEAR}–${built}` : String(LAUNCH_YEAR);
  return (
    // The extra bottom padding keeps the fixed visitor badge clear of the footer text.
    <footer className="mt-16 border-t border-hairline bg-card pb-24 sm:pb-14">
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
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-[14px] text-muted">
          <p>
            © {year} {SITE_NAME}. Built by{" "}
            <span className="font-bold text-primary">{DEVELOPER}</span>.
          </p>
          <p>Free and ad-supported. Your progress is saved only in this browser.</p>
        </div>
      </div>
    </footer>
  );
}
