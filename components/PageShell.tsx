import type { PageKey } from "@/lib/site";
import { PAGES } from "@/lib/site";
import { AdSlot } from "./AdSlot";
import { Breadcrumb } from "./Breadcrumb";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Header, optional right-rail ad at ≥1280px, and footer around a page's <main>. */
export function SiteFrame({ current, children }: { current?: PageKey; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader current={current} />
      <div className="mx-auto max-w-page px-4 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
        <main id="main" className="min-w-0">{children}</main>
        <aside aria-label="Advertisement" className="hidden xl:block">
          <div className="sticky top-[96px] pt-6">
            <AdSlot size="300x600" />
          </div>
        </aside>
      </div>
      <SiteFooter />
    </>
  );
}

/** The 760px reading column. */
export function Column({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-content ${className}`}>{children}</div>;
}

type ContentPageProps = {
  page: PageKey;
  intro: React.ReactNode;
  /** The interactive widget; may be up to 940px wide. */
  widget: React.ReactNode;
  reference: React.ReactNode;
  faq: React.ReactNode;
  related: React.ReactNode;
  /** Optional extra sections between the reference table and the second ad. */
  extra?: React.ReactNode;
};

/**
 * Every content page has the same shape: header → breadcrumb → 728×90 ad → H1 → intro →
 * widget → reference → 336×280 ad → FAQ → related cards → footer.
 */
export function ContentPage({ page, intro, widget, reference, extra, faq, related }: ContentPageProps) {
  const p = PAGES[page];
  return (
    <SiteFrame current={page}>
      <Column>
        <Breadcrumb name={p.name} path={p.path} />
        <AdSlot size="728x90" />
        <h1 className="mt-8 text-h1 text-primary">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</h1>
        <div className="mt-4 space-y-4 text-ink/90">{intro}</div>
      </Column>
      <div className="mx-auto my-10 max-w-widget">{widget}</div>
      <Column>
        {reference}
        {extra}
        <AdSlot size="336x280" className="my-12" />
        {faq}
        {related}
      </Column>
    </SiteFrame>
  );
}
