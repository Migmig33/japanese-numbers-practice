import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { KanjiTracer } from "@/components/KanjiTracer";
import { ContentPage } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
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
    q: "Can I practise with a finger or a stylus?",
    a: "Yes. The tracing pad works with a mouse, a finger on a touch screen, or a pen. Undo removes your last stroke and Clear starts over.",
  },
];

export default function WritingPage() {
  return (
    <ContentPage
      page="writing"
      intro={
        <p>
          Trace each number kanji over its guide. The numbered dots show where every stroke begins and in what order;
          the counter tells you when you&apos;ve drawn the right number of strokes. Compare your shape with the ghost and
          go again.
        </p>
      }
      widget={
        <>
          <KanjiTracer />
          <JsonLd data={quizJsonLd("writing", ["Japanese number kanji", "Kanji stroke order", "Japanese handwriting"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Number kanji stroke counts</h2>
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
