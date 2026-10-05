import Link from "next/link";
import { PAGES, type PageKey } from "@/lib/site";

export function RelatedCards({ pages, heading = "Keep practising" }: { pages: PageKey[]; heading?: string }) {
  return (
    <section aria-labelledby="related-heading" className="my-12">
      <h2 id="related-heading" className="mb-4 text-[30px] text-primary">{heading}</h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {pages.map((key) => {
          const p = PAGES[key];
          return (
            <li key={key}>
              <Link
                href={p.path}
                className="flex h-full flex-col rounded-card border border-hairline bg-card p-5 transition-colors hover:border-primary"
              >
                <span lang="ja" className="jp text-jp text-primary">{p.glyph}</span>
                <span className="mt-3 font-display text-[19px] font-black leading-snug text-ink">{p.name}</span>
                <span className="mt-1 text-[15px] leading-normal text-muted">{p.blurb}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
