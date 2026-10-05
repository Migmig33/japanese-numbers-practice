import Link from "next/link";
import { absoluteUrl, PAGES } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export function Breadcrumb({ name, path }: { name: string; path: string }) {
  const trail = [
    { name: PAGES.home.name, path: "/" },
    { name, path },
  ];
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-[15px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-ink">{c.name}</span>
              ) : (
                <>
                  <Link href={c.path} className="underline hover:text-primary">{c.name}</Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: absoluteUrl(c.path),
          })),
        }}
      />
    </nav>
  );
}
