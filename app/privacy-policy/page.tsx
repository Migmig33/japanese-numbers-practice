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

/** External links in a policy should say where they go and not leak the referrer. */
const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
    {children}
  </a>
);

const SECTIONS: Section[] = [
  {
    heading: "The short version",
    body: (
      <ul>
        <li>There are no accounts, so we never ask for your name, email or password.</li>
        <li>Your quiz progress is saved in your own browser and never sent to us.</li>
        <li>We count visits as a single number. We do not build a profile of you.</li>
        <li>Adverts come from Google AdSense, which may use cookies — including for personalised adverts, which you can opt out of.</li>
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
    heading: "Adverts and Google AdSense",
    body: (
      <>
        <p>
          {SITE_NAME} is free and paid for by adverts. Adverts on this site are served by{" "}
          <strong>Google AdSense</strong>, a Google service. Google is a third party with its own privacy policy, and
          what it collects is governed by that policy rather than this one.
        </p>
        <ul>
          <li>
            Third-party vendors, <strong>including Google</strong>, use cookies to serve adverts based on your previous
            visits to this site and other sites.
          </li>
          <li>
            Google&apos;s use of advertising cookies — including the DoubleClick DART cookie — enables it and its
            partners to serve adverts to you based on your visit to {SITE_NAME} and/or other sites on the internet.
          </li>
          <li>
            Google and its partners may also read device and connection information such as your IP address,
            approximate location, device type and browser in order to select and measure adverts.
          </li>
        </ul>
        <p>
          You can opt out of personalised advertising by visiting{" "}
          <Ext href="https://www.google.com/settings/ads">Google Ads Settings</Ext>. You can read how Google uses
          information from sites that use its services at{" "}
          <Ext href="https://policies.google.com/technologies/partner-sites">
            How Google uses information from sites or apps that use our services
          </Ext>
          , and more about advertising cookies at{" "}
          <Ext href="https://policies.google.com/technologies/ads">Google&apos;s advertising technologies page</Ext>.
          To opt out of third-party vendors&apos; use of cookies for personalised advertising more generally, see{" "}
          <Ext href="https://optout.aboutads.info/">aboutads.info</Ext> or{" "}
          <Ext href="https://www.youronlinechoices.com/">Your Online Choices</Ext>.
        </p>
        <p>
          <strong>If you are in the EEA, the UK or Switzerland</strong>, you will be asked for your consent before
          personalised adverts or advertising cookies are used, through a consent message supplied by Google. You can
          change or withdraw that choice at any time using the privacy or consent link the message provides, or by
          clearing this site&apos;s cookies in your browser. Declining personalised adverts does not stop you using the
          site — you will simply see non-personalised adverts instead.
        </p>
        <p>
          <strong>If you are in California or another US state with similar law</strong>, note that {SITE_NAME} does not
          sell personal information and holds no personal data of its own to disclose. Requests about data held by
          Google as an advertising provider are best made to Google directly, using the links above.
        </p>
        <p>
          We do not pass your progress, your answers, or anything you type into the quizzes to advertisers or to any
          other third party. Adverts are never shown inside an active quiz question.
        </p>
      </>
    ),
  },
  {
    heading: "Third parties used on this site",
    body: (
      <>
        <p>
          So you can see the whole list in one place, these are the only outside services {SITE_NAME} loads, and why:
        </p>
        <ul>
          <li>
            <strong>Google AdSense</strong> — serves the adverts that pay for the site, and may set cookies as described
            above. See <Ext href="https://policies.google.com/privacy">Google&apos;s privacy policy</Ext>.
          </li>
          <li>
            <strong>Google Fonts</strong> — the two typefaces the site is set in are served from Google&apos;s font
            service, which means your browser requests them from Google and Google therefore sees your IP address.
          </li>
          <li>
            <strong>Our own visitor counter</strong> — a small server we run ourselves, described in the section above.
            No third party is involved.
          </li>
        </ul>
        <p>
          There is no analytics on this site. There is no Google Analytics, no tag manager, no social media pixel, no
          heatmap tool and no A/B testing service. We do not know which pages you visited or how long you stayed.
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
