import { JsonLd } from "./JsonLd";

export type FaqItem = { q: string; a: string };

/** Native <details> accordion: the answers are in the HTML at build time. First one open. */
export function Faq({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="my-12">
      <h2 id="faq-heading" className="mb-4 text-[30px] text-primary">{heading}</h2>
      <div className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-card">
        {items.map((item, i) => (
          <details key={item.q} open={i === 0} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-ink [&::-webkit-details-marker]:hidden">
              <h3 className="font-sans text-[18px] font-bold">{item.q}</h3>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              >
                <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="px-5 pb-5 text-ink/90">{item.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
    </section>
  );
}
