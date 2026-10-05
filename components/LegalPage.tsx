import { AdSlot } from "./AdSlot";
import { Breadcrumb } from "./Breadcrumb";
import { Column, SiteFrame } from "./PageShell";
import { PAGES, type PageKey } from "@/lib/site";

export type Section = { heading: string; body: React.ReactNode };

/** Shared layout for the privacy policy and terms: a plain, readable document. */
export function LegalPage({ page, updated, intro, sections }: {
  page: Extract<PageKey, "privacy" | "terms">;
  updated: string;
  intro: React.ReactNode;
  sections: Section[];
}) {
  const p = PAGES[page];
  return (
    <SiteFrame>
      <Column className="pb-4">
        <Breadcrumb name={p.name} path={p.path} />
        <AdSlot size="728x90" />
        <h1 className="mt-8 text-h1 text-primary">{p.name}</h1>
        <p className="mt-2 text-[15px] font-bold text-muted">Last updated {updated}</p>
        <div className="mt-4 space-y-4 text-ink/90">{intro}</div>

        <nav aria-label="On this page" className="mt-8 rounded-card border border-hairline bg-card p-5">
          <h2 className="mb-2 font-sans text-[15px] font-bold tracking-wide text-muted uppercase">On this page</h2>
          <ol className="list-inside list-decimal space-y-1 text-[15px] marker:text-muted">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#s${i + 1}`} className="text-primary underline">{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.heading} className="mt-10 scroll-mt-24" id={`s${i + 1}`}>
            <h2 className="text-[28px] text-primary">{`${i + 1}. ${s.heading}`}</h2>
            <div className="mt-3 space-y-3 text-ink/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{s.body}</div>
          </section>
        ))}

        <AdSlot size="336x280" className="my-12" />
      </Column>
    </SiteFrame>
  );
}
