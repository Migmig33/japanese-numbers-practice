import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { WritingTracer } from "@/components/WritingTracer";
import { ContentPage } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { kanaFor, kanjiFor, readingFor } from "@/lib/compose";
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
    q: "Does hiragana have a stroke order too?",
    a: "Yes, and it follows the same habits: top to bottom, left to right, and the long sweeping stroke usually last. Hiragana came from simplified cursive kanji, so the logic carried over. Switch the tracer to ひらがな for all 46 basic characters with their stroke counts and numbered starts — き is four strokes, さ three, り two, though all three are sometimes joined into fewer in casual handwriting and in some fonts.",
  },
  {
    q: "How do you write a number like 102 in kanji?",
    a: "Write each place that isn't zero, biggest first: hundreds, then tens, then ones. 102 is 百二 — hundred, two — with nothing for the zero, and 100 and 1,000 are just 百 and 千 with no 一 in front. Those two slips are the usual ones. The numbers quiz drills the readings; this page is for the handwriting.",
  },
];

const EXAMPLES = [12, 102, 110, 600, 1000, 3684, 8300];

const PRINCIPLES: { rule: string; body: string; jp: string; example: string }[] = [
  {
    rule: "Top to bottom",
    body: "When strokes stack, the highest one goes first. This is the single most useful rule and it decides the whole of two, three and five.",
    jp: "三",
    example: "top line, middle line, bottom line — never the other way round.",
  },
  {
    rule: "Left to right",
    body: "Where strokes sit side by side, work across from the left. Combined with the first rule, this orders most characters on its own: go top-left to bottom-right.",
    jp: "四",
    example: "the left wall before the top-and-right stroke that closes the box.",
  },
  {
    rule: "Horizontal before vertical when they cross",
    body: "At a crossing, the horizontal stroke is drawn first and the vertical cuts down through it afterwards.",
    jp: "十",
    example: "the crossbar, then the upright — the reverse feels natural and is wrong.",
  },
  {
    rule: "Enclosures first, and close the box last",
    body: "For a character boxed in on several sides, draw the enclosure, then everything inside it, then seal the bottom with a final stroke.",
    jp: "四",
    example: "walls, then the two strokes inside, then the base line last of all.",
  },
];

export default function WritingPage() {
  return (
    <ContentPage
      page="writing"
      intro={
        <p>
          Trace over the guide, in either script: the number kanji 一 to 万, or all 46 basic hiragana. The numbered
          dots show where every stroke begins and in what order, and the counter tells you when you have drawn the
          right number of strokes. The chart below shows how the kanji combine into whole numbers — 102 is 百二,
          3,684 is 三千六百八十四.
        </p>
      }
      widget={
        <>
          <WritingTracer />
          <JsonLd data={quizJsonLd("writing", ["Japanese number kanji", "Kanji stroke order", "Hiragana stroke order", "Japanese handwriting"])} />
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
                  <th scope="col" className="px-5 py-2 font-bold">Kana</th>
                  <th scope="col" className="px-5 py-2 font-bold">Reading</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLES.map((n) => (
                  <tr key={n} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{n.toLocaleString("en")}</td>
                    <td lang="ja" className="jp px-5 py-1 text-jp whitespace-nowrap text-ink">{kanjiFor(n)}</td>
                    <td lang="ja" className="jp px-5 py-2 text-[20px] text-ink">{kanaFor(n)}</td>
                    <td className="px-5 py-2 font-bold text-primary">{readingFor(n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-10 text-[24px] text-primary">Above a thousand: 万</h3>
          <p className="mt-2 text-ink/90">
            Japanese counts in units of ten thousand, not thousand, so there is a character for it:{" "}
            <span lang="ja" className="jp text-[28px] align-middle text-ink">万</span>{" "}
            <em>man</em>. It is written with three strokes and is always preceded by a number — ten thousand is
            一万 <em>ichiman</em>, never bare <em>man</em>, and 25,000 is 二万五千 <em>niman gosen</em>. It is in the
            tracer and in the table below.
          </p>

          <h3 className="mt-10 text-[24px] text-primary">Stroke counts</h3>
          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Number kanji with reading and stroke count</caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Number</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kanji</th>
                  <th scope="col" className="px-5 py-2 font-bold">Kana</th>
                  <th scope="col" className="px-5 py-2 font-bold">Reading</th>
                  <th scope="col" className="px-5 py-2 font-bold">Strokes</th>
                </tr>
              </thead>
              <tbody>
                {KANJI_GUIDES.map((g) => (
                  <tr key={g.char} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{g.value.toLocaleString("en")}</td>
                    <td lang="ja" className="jp px-5 py-1 text-jp text-ink">{g.char}</td>
                    <td lang="ja" className="jp px-5 py-2 text-[20px] text-ink">{g.kana ?? kanaFor(g.value)}</td>
                    <td className="px-5 py-2 font-bold text-primary">{g.reading}</td>
                    <td className="px-5 py-2 font-bold text-ink tabular-nums">{g.strokes.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      }
      extra={
        <section aria-labelledby="principles" className="mt-12">
          <h2 id="principles" className="text-[30px] text-primary">The four rules that cover almost everything</h2>
          <p className="mt-3 text-ink/90">
            Stroke order is not arbitrary and it is not something you memorise character by character. Nearly all of it
            falls out of four habits, and the number kanji are the easiest place to learn them because the characters
            are simple enough that you can see each rule working on its own.
          </p>
          <ol className="mt-6 space-y-4">
            {PRINCIPLES.map((r, i) => (
              <li key={r.rule} className="flex gap-4 rounded-card border border-hairline bg-card p-5">
                <span className="font-display text-[28px] font-black text-accent tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-display text-[20px] text-ink">{r.rule}</h3>
                  <p className="mt-1 text-[16px] leading-normal text-ink/85">{r.body}</p>
                  <p className="mt-2 text-[15px] text-muted">
                    <span lang="ja" className="jp text-[22px] align-middle text-ink">{r.jp}</span>{" "}
                    <span className="align-middle">{r.example}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <h3 className="mt-10 text-[24px] text-primary">Why it is worth getting right</h3>
          <p className="mt-3 text-ink/90">
            You can draw a character in any order and still end up with something readable, so it is tempting to treat
            stroke order as a formality. Three things make it worth the small effort now. Written at speed, the standard
            order is what makes a character keep its shape — the proportions come from the sequence, which is why
            out-of-order handwriting looks subtly wrong even when every stroke is present. Handwriting recognition on
            phones and dictionary apps is trained on the standard order, so a wrong sequence is a common reason lookup
            fails. And stroke counts are how paper dictionaries are indexed, which you cannot do reliably if you are not
            sure where one stroke ends.
          </p>
          <p className="mt-3 text-ink/90">
            Learn it on these twelve characters and the habit transfers to every kanji you meet afterwards, most of which
            are built from pieces you will have already traced here.
          </p>
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["numbers", "time", "progress"]} />}
    />
  );
}
