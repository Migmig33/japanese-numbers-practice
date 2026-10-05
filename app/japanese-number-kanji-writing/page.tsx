import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { KanjiTracer } from "@/components/KanjiTracer";
import { NumberBuilder } from "@/components/NumberBuilder";
import { ContentPage } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { kanjiFor, readingFor } from "@/lib/compose";
import { quizJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/site";
import { KANJI_GUIDES } from "@/lib/strokes";

export function generateMetadata(): Metadata {
  return pageMetadata("writing");
}

const FAQ: FaqItem[] = [
  {
    q: "How many strokes are in the number kanji?",
    a: "One to three have one, two and three strokes. Four has five, five and six have four, seven to ten have two, hundred has six and thousand has three. The table above lists each one.",
  },
  {
    q: "Does stroke order matter?",
    a: "Yes. The standard order makes characters look balanced, keeps handwriting legible at speed, and is what dictionaries and handwriting input expect. Most of it follows two habits: top to bottom, and left to right.",
  },
  {
    q: "Does this page check my stroke order?",
    a: "Not yet. It counts your strokes and shows numbered dots where each stroke begins, so you can check your order and shape against the guide yourself.",
  },
  {
    q: "Which number kanji are hardest to write?",
    a: "Four, because its five strokes include two inside the box, and hundred, which has the most strokes of the set. Nine and seven are also easy to get backwards because they end in a hook.",
  },
  {
    q: "Do Japanese people write numbers in kanji or digits?",
    a: "Both. Digits are standard in horizontal text, prices and timetables. Kanji appear in vertical writing, set phrases, formal documents and on things like shop signs and menus, so you need to read both.",
  },
  {
    q: "How do you write a number like 102 in kanji?",
    a: "Write each place that isn't zero, biggest first: hundreds, then tens, then ones. 102 is 百二 — hundred, two — with nothing for the zero, and 100 and 1,000 are just 百 and 千 with no 一 in front. The build quiz above sets traps for both mistakes.",
  },
];

const EXAMPLES = [12, 102, 110, 600, 1000, 3684, 8300];

export default function WritingPage() {
  return (
    <ContentPage
      page="writing"
      intro={
        <p>
          See a number in digits and build it from tiles — in kanji, or as spoken romaji. 102 becomes 百二, 3,684
          becomes 三千六百八十四. Then trace each number kanji over its guide, with numbered dots for every stroke.
        </p>
      }
      widget={
        <>
          <NumberBuilder />
          <div className="mt-8">
            <KanjiTracer />
          </div>
          <JsonLd data={quizJsonLd("writing", ["Japanese number kanji", "Kanji stroke order", "Japanese handwriting"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Writing numbers in kanji</h2>
          <p className="mt-2 text-ink/90">Write each non-zero place, biggest first. Zeros are simply left out.</p>
          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">Examples</caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Number</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kanji</th>
                  <th scope="col" className="px-5 py-2 font-bold">Reading</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLES.map((n) => (
                  <tr key={n} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{n.toLocaleString("en")}</td>
                    <td lang="ja" className="jp px-5 py-1 text-jp whitespace-nowrap text-ink">{kanjiFor(n)}</td>
                    <td className="px-5 py-2 font-bold text-primary">{readingFor(n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-10 text-[24px] text-primary">Stroke counts</h3>
          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Number kanji with reading and stroke count</caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Number</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kanji</th>
                  <th scope="col" className="px-5 py-2 font-bold">Reading</th>
                  <th scope="col" className="px-5 py-2 font-bold">Strokes</th>
                </tr>
              </thead>
              <tbody>
                {KANJI_GUIDES.map((g) => (
                  <tr key={g.char} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{g.value.toLocaleString("en")}</td>
                    <td lang="ja" className="jp px-5 py-1 text-jp text-ink">{g.char}</td>
                    <td className="px-5 py-2 font-bold text-primary">{g.reading}</td>
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{g.strokes.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["numbers", "time", "progress"]} />}
    />
  );
}
