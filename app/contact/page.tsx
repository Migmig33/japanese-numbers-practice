import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Column, SiteFrame } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { CONTACT_EMAIL, DEVELOPER, PAGES, pageMetadata, SITE_NAME } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("contact");
}

const Mail = ({ subject }: { subject?: string }) => (
  <a
    href={`mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}
    className="text-primary underline"
  >
    {CONTACT_EMAIL}
  </a>
);

const REASONS: { heading: string; subject: string; body: React.ReactNode }[] = [
  {
    heading: "A reading or rule is wrong",
    subject: "Sennin correction",
    body: (
      <>
        <p>
          The most useful message you can send, and the one I answer first. Please include the page, the character or
          number in question, what {SITE_NAME} said, and what it should say. If the form is right in some contexts but
          not others, say which — that distinction is usually the thing worth adding to the site.
        </p>
      </>
    ),
  },
  {
    heading: "Something is broken",
    subject: "Sennin bug report",
    body: (
      <p>
        Tell me what you did, what happened, and what you expected instead. Your browser and whether you are on a phone
        or a computer both help a lot — the clock hands, the tracing pad and the typing input are the parts most likely
        to behave differently across devices. A screenshot is worth several paragraphs.
      </p>
    ),
  },
  {
    heading: "A suggestion",
    subject: "Sennin suggestion",
    body: (
      <p>
        Ideas for topics, question types or reference tables are welcome. Before you write: counters, dates and the days
        of the week are already on the list, and the reasons they are not here yet are set out on the{" "}
        <Link href={PAGES.about.path} className="text-primary underline">about page</Link>. A suggestion that comes with
        the reason you wanted it — the thing you were trying to learn when the site let you down — is far more useful
        than a feature name.
      </p>
    ),
  },
  {
    heading: "Advertising, licensing or press",
    subject: "Sennin enquiry",
    body: (
      <p>
        {SITE_NAME} is one person’s side project supported by display adverts, so there is no media kit and no sales
        contact. Enquiries about advertising, using the material with a class or in a product, or writing about the
        site all go to the same address.
      </p>
    ),
  },
];

export default function ContactPage() {
  const p = PAGES.contact;
  return (
    <SiteFrame current="contact">
      <Column className="pb-4">
        <Breadcrumb name={p.name} path={p.path} />
        <AdSlot size="728x90" />

        <h1 className="mt-8 text-h1 text-primary">Contact</h1>
        <div className="mt-4 space-y-4 text-ink/90">
          <p>
            {SITE_NAME} is built by one person, so there is one address and it is read by the person who writes the
            code. There is no contact form, because the site has no server to receive one — every page here is a static
            file, which is also why nothing you type into the quizzes ever leaves your browser.
          </p>
        </div>

        <div className="my-8 rounded-card border border-hairline bg-card p-6">
          <h2 className="font-sans text-[15px] font-bold tracking-wide text-muted uppercase">Email</h2>
          <p className="mt-2 font-display text-[28px] font-black break-words">
            <Mail />
          </p>
          <p className="mt-3 text-[15px] text-ink/80">
            Written and answered by {DEVELOPER}. Expect a few days rather than a few hours — this is a side project, not
            a support desk, and messages are answered in the evenings. Every message does get read.
          </p>
        </div>

        <section aria-labelledby="what-to-write" className="mt-12">
          <h2 id="what-to-write" className="text-[30px] text-primary">What to write about</h2>
          <p className="mt-3 text-ink/90">
            All of these go to the same inbox. The suggested subject lines are only there to help me sort them.
          </p>
          <div className="mt-6 space-y-6">
            {REASONS.map((r) => (
              <div key={r.heading} className="rounded-card border border-hairline bg-card p-5">
                <h3 className="font-display text-[21px] font-black text-ink">{r.heading}</h3>
                <div className="mt-2 space-y-3 text-[16px] text-ink/85">{r.body}</div>
                <p className="mt-3 text-[14px] text-muted">
                  Suggested subject: <Mail subject={r.subject} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="cannot-help" className="mt-12">
          <h2 id="cannot-help" className="text-[30px] text-primary">Two things I cannot help with</h2>
          <p className="mt-3 text-ink/90">
            <strong>Recovering lost progress.</strong> There are no accounts, and your scores are stored only in the
            browser you used. If you cleared your browser data, switched device or practised in a private window, the
            history is gone and there is no copy anywhere for me to restore. This is a consequence of the site holding
            no data about you, which on balance is the trade I would rather make.
          </p>
          <p className="mt-3 text-ink/90">
            <strong>Deleting your personal data.</strong> Not because I will not, but because there is nothing to
            delete — no name, no email, no account, no record of your answers. Clearing this site’s data in your browser
            settings removes everything that exists. The{" "}
            <Link href={PAGES.privacy.path} className="text-primary underline">privacy policy</Link> explains what is
            and is not stored. If you think it is wrong about that, please do write — I will look into it.
          </p>
        </section>

        <AdSlot size="336x280" className="my-12" />

        <RelatedCards pages={["about", "privacy", "terms"]} heading="More about the site" />
      </Column>
    </SiteFrame>
  );
}
