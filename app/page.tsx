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
    title: "Pick what to practise",
    body: "Choose any mix of number and time sets — one to ninety thousand, the native count, hours, minutes, half past, a.m. and p.m.",
  },
  {
    title: "Type the reading",
    body: "Each round is twelve questions. Type the reading in romaji; macrons and long vowels are optional, so kyū, kyuu and kyu all count.",
  },
  {
    title: "Learn from every miss",
    body: "Miss one and you get the rule behind it — why 600 is roppyaku, why 4 o’clock is yoji — and the item comes back two questions later.",
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
            <h1 className="text-h1 text-primary">Learn Japanese numbers and tell the time</h1>
            <p className="mt-3 text-ink/90">
              Free quick-fire quizzes for reading Japanese numbers, telling time and writing number kanji.
              No account, no download — your progress stays in this browser.
            </p>
          </div>
        </div>

        <RelatedCards pages={["numbers", "time", "writing"]} heading="Choose a quiz" />

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

        <AdSlot size="336x280" className="my-12" />
      </Column>
    </SiteFrame>
  );
}
