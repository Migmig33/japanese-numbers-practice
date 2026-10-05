import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type Section } from "@/components/LegalPage";
import { CONTACT_EMAIL, DEVELOPER, LAUNCH_YEAR, PAGES, pageMetadata, SITE_NAME } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("terms");
}

const UPDATED = "5 October 2026";

const SECTIONS: Section[] = [
  {
    heading: "Using the site",
    body: (
      <>
        <p>
          {SITE_NAME} is free to use for learning Japanese numbers and telling the time. There is nothing to sign up
          for and nothing to pay. By using the site you accept these terms; if you do not accept them, please do not use
          the site.
        </p>
        <p>You may use {SITE_NAME} for your own study, and teachers are welcome to use it with a class.</p>
      </>
    ),
  },
  {
    heading: "What you may not do",
    body: (
      <ul>
        <li>Copy the site&apos;s design, text or code to republish it as your own.</li>
        <li>Interfere with the site or try to break it, including sending automated traffic to inflate the visitor count.</li>
        <li>Use the site in any way that breaks the law where you live.</li>
        <li>Remove or hide the adverts that pay for the site, or the credit to its developer.</li>
      </ul>
    ),
  },
  {
    heading: "Accuracy of the lessons",
    body: (
      <>
        <p>
          The readings and rules here have been prepared carefully — the irregular ones such as 四時 <em>yoji</em>,
          九時 <em>kuji</em> and 六百 <em>roppyaku</em> are taken from standard forms rather than guessed at. Even so,
          {" "}{SITE_NAME} is a practice aid, not a textbook or a qualification, and real Japanese has regional and
          informal variation this site does not cover.
        </p>
        <p>
          We make no promise that every reading suits every context. If you spot a mistake, please tell us — corrections
          are genuinely welcome.
        </p>
      </>
    ),
  },
  {
    heading: "Your progress is not backed up",
    body: (
      <p>
        Your scores and practice history live only in the browser you used, as explained in the{" "}
        <Link href={PAGES.privacy.path} className="text-primary underline">privacy policy</Link>. They are not stored on
        a server and cannot be recovered. Clearing your browser data, using a different device, or browsing privately
        will lose them, and we cannot restore them for you.
      </p>
    ),
  },
  {
    heading: "Adverts and outside links",
    body: (
      <p>
        {SITE_NAME} carries adverts from a third-party network, and those adverts may link to sites we have no control
        over. We do not endorse advertised products and are not responsible for anything on another company&apos;s site.
        Any dealings you have with an advertiser are between you and them.
      </p>
    ),
  },
  {
    heading: "Availability",
    body: (
      <p>
        The site is offered as it is. We do not promise it will always be available, free of faults, or that it will
        stay online indefinitely, and we may change or withdraw any part of it at any time. Features that depend on an
        outside service — adverts and the visitor counter — may stop working without notice.
      </p>
    ),
  },
  {
    heading: "Liability",
    body: (
      <p>
        To the extent the law allows, {DEVELOPER} is not liable for any loss arising from your use of {SITE_NAME},
        including lost practice progress or anything that follows from relying on the material here. Nothing in these
        terms limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    heading: "Ownership",
    body: (
      <p>
        The design, text, code and artwork of {SITE_NAME} are © {LAUNCH_YEAR} {DEVELOPER}, all rights reserved. The
        Japanese language itself, of course, belongs to nobody — the characters, readings and grammar taught here are
        common knowledge, and you are free to use what you learn however you like.
      </p>
    ),
  },
  {
    heading: "Changes and contact",
    body: (
      <p>
        We may update these terms; the date at the top of this page shows when they last changed, and continuing to use
        the site means you accept the current version. Questions can go to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      page="terms"
      updated={UPDATED}
      intro={
        <p>
          These are the terms for using {SITE_NAME}, a free site for practising Japanese numbers and telling the time,
          built by {DEVELOPER}.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
