import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type Section } from "@/components/LegalPage";
import { CONTACT_EMAIL, DEVELOPER, PAGES, pageMetadata, SITE_NAME } from "@/lib/site";
import { COUNTER_URL } from "@/lib/visitors";

export function generateMetadata(): Metadata {
  return pageMetadata("privacy");
}

const UPDATED = "5 October 2026";

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>;

const SECTIONS: Section[] = [
  {
    heading: "The short version",
    body: (
      <ul>
        <li>There are no accounts, so we never ask for your name, email or password.</li>
        <li>Your quiz progress is saved in your own browser and never sent to us.</li>
        <li>We count visits as a single number. We do not build a profile of you.</li>
        <li>Adverts on the site come from a third party, which may use cookies.</li>
      </ul>
    ),
  },
  {
    heading: "What stays in your browser",
    body: (
      <>
        <p>
          {SITE_NAME} uses your browser&apos;s local storage — not cookies — to remember your practice. This stays on
          your device. We cannot read it, and it is not sent anywhere.
        </p>
        <ul>
          <li><strong>Your progress</strong>: scores, XP, level, which items you have answered and the days you practised.</li>
          <li><strong>A random visitor id</strong>: a string of random characters your browser invents for itself. It is not linked to you, and is used only so the same browser is not counted twice in one day.</li>
          <li><strong>The date you were last counted</strong>, for the same reason.</li>
        </ul>
        <p>
          Clearing your browser data erases all of it, including your progress, which cannot then be recovered. You can
          see everything we have stored on the{" "}
          <Link href={PAGES.progress.path} className="text-primary underline">progress page</Link>.
        </p>
      </>
    ),
  },
  {
    heading: "The visitor counter",
    body: (
      <>
        <p>
          The number in the corner of the page is a count of visits. Your browser counts once per day: returning later
          the same day adds nothing, and visiting again tomorrow adds one.
        </p>
        <p>
          {COUNTER_URL
            ? "The count is kept on our own small server, which stores three things: the running total, a per-day total, and a short-lived marker that your random id has already been counted today. "
            : "When enabled, the count is kept on our own small server, which stores three things: the running total, a per-day total, and a short-lived marker that your random id has already been counted today. "}
          That marker is deleted automatically after two days. We do not store IP addresses, browser details or any
          information about what you did on the site, and the count is not shared with anyone.
        </p>
      </>
    ),
  },
  {
    heading: "Adverts",
    body: (
      <>
        <p>
          {SITE_NAME} is free and paid for by adverts. Adverts are supplied by a third-party advertising network, which
          is a separate company with its own privacy policy. To show adverts, that network may set its own cookies or
          read device information such as your approximate location, device type and the pages you view.
        </p>
        <p>
          We do not pass your progress or anything you type into the quizzes to advertisers. Depending on where you
          live, you may see a consent banner from the advertising network, and you can usually opt out of personalised
          advertising in your device or browser settings.
        </p>
      </>
    ),
  },
  {
    heading: "What we never collect",
    body: (
      <ul>
        <li>Names, email addresses, phone numbers or payment details.</li>
        <li>Accounts or passwords — there is nothing to sign up for.</li>
        <li>Your answers, the words you type, or anything you draw on the tracing pad.</li>
        <li>Any profile of you across sites. We do not sell or share data, because we do not hold any.</li>
      </ul>
    ),
  },
  {
    heading: "Your choices",
    body: (
      <ul>
        <li><strong>Erase everything</strong>: clear this site&apos;s data in your browser settings. That removes your progress, your random id and the date you were last counted.</li>
        <li><strong>Block storage</strong>: the site still works if you block local storage or use private browsing — your progress simply will not be remembered between sessions.</li>
        <li><strong>Ask us</strong>: because we hold nothing that identifies you, there is no personal record for us to send you or delete. If you think otherwise, write to us and we will look into it.</li>
      </ul>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        {SITE_NAME} is suitable for all ages and does not knowingly collect personal information from anyone, children
        included. If you believe a child has provided personal information through this site, please contact us so we
        can look into it.
      </p>
    ),
  },
  {
    heading: "Changes and contact",
    body: (
      <>
        <p>
          If this policy changes we will update the date at the top of this page. Significant changes will be noted on
          the home page.
        </p>
        <p>
          Questions about privacy can go to <Mail />. {SITE_NAME} is built and run by {DEVELOPER}.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      page="privacy"
      updated={UPDATED}
      intro={
        <p>
          {SITE_NAME} is a free practice site with no accounts. This page explains, in plain language, exactly what is
          stored when you use it and what is not.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
