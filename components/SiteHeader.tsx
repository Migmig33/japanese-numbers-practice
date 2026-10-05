import Link from "next/link";
import { NAV, PAGES, type PageKey } from "@/lib/site";
import { SenninHead } from "./Sennin";

export function SiteHeader({ current }: { current?: PageKey }) {
  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-hairline bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-40 focus:rounded-button focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-full max-w-page items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Sennin home">
          <SenninHead size={32} />
          <span className="font-display text-[26px] font-black tracking-tight text-primary max-sm:hidden">Sennin</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-0.5 sm:gap-2">
            {NAV.map((key) => {
              const active = key === current;
              return (
                <li key={key}>
                  <Link
                    href={PAGES[key].path}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-2 py-1.5 text-[15px] font-bold sm:px-3 sm:text-base ${
                      active ? "bg-primary text-card" : "text-primary hover:bg-hairline"
                    }`}
                  >
                    {PAGES[key].nav}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
