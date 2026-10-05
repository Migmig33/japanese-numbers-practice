import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Column, SiteFrame } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { Sennin } from "@/components/Sennin";
import { CONTACT_EMAIL, DEVELOPER, PAGES, pageMetadata, SITE_NAME } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("about");
}

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>;

/** The irregular forms the site is careful about, shown as evidence rather than a claim. */
const IRREGULARS: { jp: string; wrong: string; right: string; why: string }[] = [
  { jp: "四時", wrong: "yonji", right: "yoji", why: "Four o’clock drops to yo before 時." },
  { jp: "九時", wrong: "kyuuji", right: "kuji", why: "Nine o’clock uses ku, never kyuu." },
  { jp: "七時", wrong: "nanaji", right: "shichiji", why: "Seven o’clock keeps the shichi reading." },
  { jp: "六百", wrong: "rokuhyaku", right: "roppyaku", why: "The h becomes p after 六." },
  { jp: "八千", wrong: "hachisen", right: "hassen", why: "八 shortens and s doubles." },
  { jp: "一分", wrong: "ichifun", right: "ippun", why: "一 shortens and f becomes p." },
];

export default function AboutPage() {
  const p = PAGES.about;
  return (
    <SiteFrame current="about">
      <Column className="pb-4">
        <Breadcrumb name={p.name} path={p.path} />
        <AdSlot size="728x90" />

        <div className="mt-8 flex items-center gap-6 max-sm:flex-col max-sm:items-start">
          <Sennin state="idle" size={120} />
          <div>
            <h1 className="text-h1 text-primary">About {SITE_NAME}</h1>
            <p className="mt-3 text-ink/90">
              {SITE_NAME} is a free, ad-supported site for drilling the parts of Japanese that charts alone never
              fix: reading numbers out loud, telling the time, and getting the small words right. No accounts, no
              sign-up, nothing to install.
            </p>
          </div>
        </div>

        <section aria-labelledby="why" className="mt-12">
          <h2 id="why" className="text-[30px] text-primary">Why this site exists</h2>
          <p className="mt-3 text-ink/90">
            Japanese numbers look like the easiest thing a beginner can learn. Ten characters, a rule for combining
            them, done in an afternoon. Then you try to say 600 and discover it is not{" "}
            <em>rokuhyaku</em> but <em>roppyaku</em>. You try to say four o’clock and discover that{" "}
            <em>yonji</em>, the form every rule you have learned predicts, is simply not a word — it is{" "}
            <em>yoji</em>. Nine o’clock is <em>kuji</em>, not <em>kyuuji</em>.
          </p>
          <p className="mt-3 text-ink/90">
            There are perhaps twenty of these exceptions, and they are exactly the twenty things you need when you are
            standing in a shop or listening to a train announcement. Most free resources give you a chart and leave you
            to notice the irregular rows on your own. A chart cannot tell you that you have just said a non-word with
            complete confidence. A quiz can.
          </p>
          <p className="mt-3 text-ink/90">
            So {SITE_NAME} is built the other way round: every round is twelve questions, every miss shows you the rule
            behind it, and the item you missed comes back two questions later while it still stings. That is the whole
            idea. The rest of the site is in service of it.
          </p>
        </section>

        <section aria-labelledby="accuracy" className="mt-12">
          <h2 id="accuracy" className="text-[30px] text-primary">How the Japanese is prepared</h2>
          <p className="mt-3 text-ink/90">
            Two different methods, chosen deliberately, because numbers and times are not the same kind of problem.
          </p>
          <p className="mt-3 text-ink/90">
            <strong>Regular numbers are generated from rules, not typed in by hand.</strong> The site composes 1–10
            into tens, hundreds, thousands, 万 and 億 in code, with the sound changes applied as explicit overrides.
            Typing out hundreds of rows by hand is how a wrong reading slips into a chart and sits there for years; a
            rule that is wrong is wrong everywhere at once, which means a single test catches it. The number readings
            are covered by unit tests that run on every change.
          </p>
          <p className="mt-3 text-ink/90">
            <strong>Times are not derived at all.</strong> The hours and minutes are irregular enough that deriving
            them would invent words, so they are stored verbatim from the standard forms and never computed. These are
            the ones the site is deliberately careful about:
          </p>

          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">
                Forms a rule would get wrong
              </caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Written</th>
                  <th scope="col" className="px-5 py-2 font-bold">Not</th>
                  <th scope="col" className="px-5 py-2 font-bold">But</th>
                  <th scope="col" className="px-5 py-2 font-bold">Why</th>
                </tr>
              </thead>
              <tbody>
                {IRREGULARS.map((r) => (
                  <tr key={r.jp} className="border-b border-hairline last:border-b-0">
                    <td lang="ja" className="jp px-5 py-1 text-[32px] whitespace-nowrap text-ink">{r.jp}</td>
                    <td className="px-5 py-2 text-muted line-through">{r.wrong}</td>
                    <td className="px-5 py-2 font-bold text-primary">{r.right}</td>
                    <td className="px-5 py-2 text-[15px] text-ink/80">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="fair" className="mt-12">
          <h2 id="fair" className="text-[30px] text-primary">Marking that tries to be fair</h2>
          <p className="mt-3 text-ink/90">
            A quiz that marks you wrong on a typing convention teaches you nothing except to resent it. When you type a
            reading, {SITE_NAME} normalises your answer and the stored one before comparing: case and spacing are
            ignored, macrons are folded (<em>kyū</em> → <em>kyu</em>), long vowels collapse so{" "}
            <em>kyuu</em> and <em>kyu</em> both pass, and apostrophes and hyphens are stripped. Every genuine
            alternative is accepted too — <em>shichi</em> or <em>nana</em>, <em>yon</em> or <em>shi</em>,{" "}
            <em>kyuu</em> or <em>ku</em>, <em>juppun</em> or <em>jippun</em>.
          </p>
          <p className="mt-3 text-ink/90">
            What it will not accept is a form that is wrong even though the rules predict it. <em>Yonji</em> is marked
            wrong on purpose, because the point of the exercise is that four o’clock is <em>yoji</em>.
          </p>
        </section>

        <section aria-labelledby="scope" className="mt-12">
          <h2 id="scope" className="text-[30px] text-primary">What it covers, and what it does not</h2>
          <p className="mt-3 text-ink/90">
            {SITE_NAME} covers hiragana, numbers from 一 to 十億, telling the time, the stroke order of the number
            kanji, and the beginner particles は, が, を, に and で. That is five topics done properly rather than
            twenty done thinly.
          </p>
          <p className="mt-3 text-ink/90">
            It deliberately leaves out the counters (人, 個, 本), dates (月, 日) and the days of the week. Those belong
            together as their own topic and they are a bigger job than they look — adding half of them would be worse
            than leaving them out. Katakana and kanji beyond the numbers are not here either.
          </p>
          <p className="mt-3 text-ink/90">
            It is a practice aid, not a textbook and not a qualification. Real Japanese has regional and informal
            variation this site does not try to cover, and you should expect a classroom, a teacher or a textbook to
            give you things a drill never will.
          </p>
        </section>

        <section aria-labelledby="who" className="mt-12">
          <h2 id="who" className="text-[30px] text-primary">Who builds it</h2>
          <p className="mt-3 text-ink/90">
            {SITE_NAME} is built and run by <strong className="text-primary">{DEVELOPER}</strong>, working alone. It is
            not a company and there is no team — which is worth knowing both because it explains why the scope is
            narrow, and because it means a correction you send goes straight to the person who can act on it.
          </p>
          <p className="mt-3 text-ink/90">
            <strong>Corrections are genuinely welcome, and they are the most useful thing you can send.</strong> If a
            reading here is wrong, or right but misleading in a context the site does not mention, write to <Mail /> or
            use the <Link href={PAGES.contact.path} className="text-primary underline">contact page</Link>. Please say
            which page and which item, and I will fix it or explain why it stands.
          </p>
          <p className="mt-3 text-ink/90">
            The mascot is Sennin, the old hermit of the site’s name. He is a bust, so he cannot point at anything — he
            just reacts, and he holds still if your system asks for reduced motion.
          </p>
        </section>

        <section aria-labelledby="money" className="mt-12">
          <h2 id="money" className="text-[30px] text-primary">How it is paid for</h2>
          <p className="mt-3 text-ink/90">
            Adverts, and nothing else. There is no paid tier, no newsletter and nothing to buy. In exchange the site
            asks nothing of you: no account, no email address, no sign-up wall in front of the quizzes.
          </p>
          <p className="mt-3 text-ink/90">
            Your practice history is saved in your own browser’s local storage and never reaches a server, which is why
            the <Link href={PAGES.progress.path} className="text-primary underline">progress page</Link> only knows
            about the browser you are reading this in, and why clearing your browser data erases it for good. The
            adverts come from Google AdSense, which may set its own cookies; the{" "}
            <Link href={PAGES.privacy.path} className="text-primary underline">privacy policy</Link> sets out exactly
            what is stored, by whom, and how to opt out of personalised advertising.
          </p>
        </section>

        <AdSlot size="336x280" className="my-12" />

        <RelatedCards pages={["hiragana", "numbers", "time", "particles"]} heading="Start practising" />
      </Column>
    </SiteFrame>
  );
}
