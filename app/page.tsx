import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Column, SiteFrame } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { Sennin } from "@/components/Sennin";
import { itemsInSet } from "@/lib/items";
import { pageMetadata, PAGES } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("home");
}

const STEPS = [
  {
    title: "Pick how you practise",
    body: "Every quiz offers the same material more than one way, all open from the start: pick from options, set a clock, build a sentence, or type the answer with nothing to lean on.",
  },
  {
    title: "Play a round of twelve",
    body: "A speed bonus, a streak multiplier up to ×3, and a grade from A+ down to E when you finish. Typing is forgiving — kyū, kyuu and kyu all count.",
  },
  {
    title: "Learn from every miss",
    body: "Miss one and you get the rule behind it — why 600 is roppyaku, why 4 o’clock is yoji, why すき takes が — and the item comes back two questions later.",
  },
];

/** The irregular forms a learner's own rules predict wrongly. */
const TRAPS: { jp: string; wrong: string; right: string; why: string }[] = [
  { jp: "六百", wrong: "rokuhyaku", right: "roppyaku", why: "The h of 百 becomes p after 六, 八 and 十." },
  { jp: "四時", wrong: "yonji", right: "yoji", why: "Four o’clock uses yo. Yonji is not a word." },
  { jp: "九時", wrong: "kyuuji", right: "kuji", why: "Nine o’clock uses ku, though nine alone is kyuu." },
  { jp: "一分", wrong: "ichifun", right: "ippun", why: "一 shortens and f hardens to p before 分." },
  { jp: "三千", wrong: "sansen", right: "sanzen", why: "The s of 千 voices to z after 三." },
  { jp: "一万", wrong: "man", right: "ichiman", why: "Ten thousand always keeps its 一." },
];

const AUDIENCE: { title: string; body: string }[] = [
  {
    title: "Absolute beginners",
    body: "Start with the hiragana chart and the numbers one to ten. Nothing here assumes you can already read Japanese — every character is shown with its reading.",
  },
  {
    title: "Anyone heading to Japan",
    body: "Prices, platform numbers, opening hours and times are the Japanese you will actually need first. The time quiz and the big numbers are built for exactly that.",
  },
  {
    title: "Students revising",
    body: "Twelve-question rounds, a grade at the end, and a mastery heatmap that shows which items you keep missing so you can spend your revision where it counts.",
  },
];

export default function Home() {
  const ones = itemsInSet("ones");
  return (
    <SiteFrame>
      <Column>
        <div className="pt-6">
          <AdSlot size="728x90" />
        </div>
        <div className="mt-10 flex items-center gap-6 max-sm:flex-col max-sm:items-start">
          <Sennin state="idle" size={120} />
          <div>
            <h1 className="text-h1 text-primary">Learn Japanese, one round at a time</h1>
            <p className="mt-3 text-ink/90">
              Free quick-fire quizzes with instant feedback and no sign-up: learn hiragana, read kanji numbers up to
              十億, tell the time, trace the characters stroke by stroke, and get the particles right. Rounds are twelve
              questions long, every miss explains the rule behind it, and your progress stays in this browser — there is
              no account to make.
            </p>
          </div>
        </div>

        <RelatedCards pages={["hiragana", "numbers", "time", "particles"]} heading="Choose a quiz" />

        <section aria-labelledby="how-it-works" className="my-12">
          <h2 id="how-it-works" className="mb-4 text-[30px] text-primary">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-card border border-hairline bg-card p-5">
                <span className="font-display text-[28px] font-black text-accent tabular-nums">{i + 1}</span>
                <h3 className="mt-1 font-display text-[19px] text-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-normal text-ink/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="one-to-ten" className="my-12">
          <h2 id="one-to-ten" className="mb-2 text-[30px] text-primary">One to ten at a glance</h2>
          <p className="mb-4 text-ink/90">
            Everything else is built from these ten. The full chart, including the sound changes, is on the{" "}
            <Link href={`${PAGES.numbers.path}#reference`} className="text-primary underline">numbers quiz page</Link>.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ones.map((i) => (
              <li key={i.id} className="flex flex-col items-center rounded-card border border-hairline bg-card py-4">
                <span lang="ja" className="jp text-jp text-ink">{i.jp}</span>
                <span className="mt-1 font-bold text-primary">{i.readings.join(" / ")}</span>
                <span className="text-[14px] text-muted tabular-nums">{i.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="the-hard-part" className="my-12">
          <h2 id="the-hard-part" className="mb-2 text-[30px] text-primary">The part that actually trips people up</h2>
          <p className="mb-4 text-ink/90">
            Japanese numbers look like an afternoon&apos;s work: ten characters and a rule for stacking them. The
            trouble is the handful of places where the rule quietly stops applying — and those are exactly the words you
            need in a shop, at a ticket machine or listening to a train announcement. Every one of them is drilled here,
            with the reason attached.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TRAPS.map((t) => (
              <li key={t.jp} className="flex items-baseline gap-4 rounded-card border border-hairline bg-card p-4">
                <span lang="ja" className="jp shrink-0 text-[34px] leading-none text-ink">{t.jp}</span>
                <span className="min-w-0">
                  <span className="block font-bold">
                    <span className="text-muted line-through">{t.wrong}</span>{" "}
                    <span className="text-primary">{t.right}</span>
                  </span>
                  <span className="mt-1 block text-[15px] leading-normal text-ink/80">{t.why}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] text-ink/80">
            Miss one in a quiz and you get that explanation on the spot, then the same item again two questions later.
          </p>
        </section>

        <section aria-labelledby="who-for" className="my-12">
          <h2 id="who-for" className="mb-4 text-[30px] text-primary">Who this is for</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded-card border border-hairline bg-card p-5">
                <h3 className="font-display text-[19px] text-ink">{a.title}</h3>
                <p className="mt-2 text-[15px] leading-normal text-ink/80">{a.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-ink/90">
            It is a drill, not a course. {" "}
            <Link href={PAGES.about.path} className="text-primary underline">How the readings are prepared</Link>{" "}
            — and what the site deliberately leaves out — is set out on the about page.
          </p>
        </section>

        <section aria-labelledby="free" className="my-12">
          <h2 id="free" className="mb-2 text-[30px] text-primary">Free, and no sign-up</h2>
          <p className="text-ink/90">
            Every quiz is open immediately. There is no account, no email address, no paywall and no trial. The site is
            paid for by adverts, which never appear inside a question you are answering.
          </p>
          <p className="mt-3 text-ink/90">
            Your scores, streak and mastery heatmap are saved in your browser&apos;s own storage and never sent anywhere
            — see them on the{" "}
            <Link href={PAGES.progress.path} className="text-primary underline">progress page</Link>. That also means
            they are tied to this browser: clearing your data erases them, and they will not follow you to another
            device. The{" "}
            <Link href={PAGES.privacy.path} className="text-primary underline">privacy policy</Link> spells out exactly
            what is stored and what is not.
          </p>
        </section>

        <AdSlot size="336x280" className="my-12" />
      </Column>
    </SiteFrame>
  );
}
