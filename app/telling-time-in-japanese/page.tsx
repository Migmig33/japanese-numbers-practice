import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ContentPage } from "@/components/PageShell";
import { TimeQuiz } from "@/components/TimeQuiz";
import { ReferenceTable } from "@/components/ReferenceTable";
import { RelatedCards } from "@/components/RelatedCards";
import { ITEMS, itemsInSet } from "@/lib/items";
import { quizJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/site";
import { minuteKana, minuteKanji, minuteReading } from "@/lib/time";
import type { Item } from "@/lib/types";

export function generateMetadata(): Metadata {
  return pageMetadata("time");
}

const MEANINGS: Record<string, string> = {
  "half-han": "half past",
  "ampm-gozen": "a.m.",
  "ampm-gogo": "p.m.",
  "question-nanji": "what time?",
  "question-nanpun": "how many minutes?",
};

const FAQ: FaqItem[] = [
  {
    q: "How do you say o'clock in Japanese?",
    a: "Add ji to the number: ichiji is one o'clock, niji two o'clock, sanji three o'clock. Three hours break the pattern — 4, 7 and 9 o'clock — so learn those on their own.",
  },
  {
    q: "Why is 4 o'clock yoji and not yonji?",
    a: "It's an irregular reading. Four is usually yon, but four o'clock is always yoji. Yonji is a very common learner mistake.",
  },
  {
    q: "Why is 9 o'clock kuji?",
    a: "Nine has two readings, kyuu and ku, and the hour always uses ku. Kyuuji is wrong. In the same way, 7 o'clock is shichiji.",
  },
  {
    q: "How do you say minutes in Japanese?",
    a: "Minutes use fun, which changes to pun after some numbers: ippun, nifun, sanpun, yonpun, gofun, roppun, nanafun, happun, kyuufun, juppun. Past ten you say the number then 分, and the ones digit keeps its form — 29分 is nijuukyuufun, 21分 is nijuuippun.",
  },
  {
    q: "How do you say half past?",
    a: "Put han after the hour. Sanji han is half past three. You'll hear it far more often than the full thirty-minute form.",
  },
  {
    q: "How do you say a.m. and p.m.?",
    a: "Gozen means a.m. and gogo means p.m. Unlike English, they go before the time: gogo sanji is 3 p.m. To ask the time, say nanji desu ka.",
  },
];

const COMPOUND_MINUTES = [11, 15, 20, 21, 25, 29, 36, 45, 50, 59];

export default function TimePage() {
  const mods = ITEMS.filter((i) => i.kind === "modifier");
  return (
    <ContentPage
      page="time"
      intro={
        <p>
          Japanese time is mostly regular, with a handful of readings you just have to know: yoji, kuji, shichiji and
          the pun minutes. Practise them three ways, all open from the start — pick the time a clock phrase means, drag
          the hands to match it, or type the reading from memory. Each round of twelve ends with a grade.
        </p>
      }
      widget={
        <>
          <TimeQuiz />
          <JsonLd data={quizJsonLd("time", ["Telling time in Japanese", "Japanese hours", "Japanese minutes"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Hours and minutes chart</h2>
          <p className="mt-2 text-ink/90">The irregular readings are the ones to watch: 4, 7 and 9 o&apos;clock, and the pun minutes.</p>
          <ReferenceTable caption="Hours" items={itemsInSet("hours")} valueHeader="Time" value={(i) => `${i.value}:00`} showNotes />
          <ReferenceTable
            caption="Minutes"
            items={itemsInSet("minutes")}
            valueHeader="Minutes"
            value={(i) => `${i.value} min`}
            showNotes
          />
          <h3 className="mt-10 text-[24px] text-primary">Minutes past ten</h3>
          <p className="mt-2 text-ink/90">
            Say the number, then 分. The ones digit keeps the form it has on its own, so the pun of 一分 and 六分
            survives in 二十一分 and 三十六分.
          </p>
          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">Examples</caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Minutes</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kanji</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kana</th>
                  <th scope="col" className="px-5 py-2 font-bold">Reading</th>
                </tr>
              </thead>
              <tbody>
                {COMPOUND_MINUTES.map((m) => (
                  <tr key={m} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{m} min</td>
                    <td lang="ja" className="jp px-5 py-1 text-jp whitespace-nowrap text-ink">{minuteKanji(m)}</td>
                    <td lang="ja" className="jp px-5 py-2 text-[20px] text-ink">{minuteKana(m)}</td>
                    <td className="px-5 py-2 font-bold text-primary">{minuteReading(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ReferenceTable
            caption="Half past, a.m., p.m. and questions"
            items={mods}
            valueHeader="Meaning"
            value={(i: Item) => MEANINGS[i.id] ?? ""}
          />
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["numbers", "writing", "progress"]} />}
    />
  );
}
