import type { Metadata } from "next";
import Link from "next/link";
import { Faq, type FaqItem } from "@/components/Faq";
import { HiraganaQuiz } from "@/components/HiraganaQuiz";
import { JsonLd } from "@/components/JsonLd";
import { KanaChart } from "@/components/KanaChart";
import { ContentPage } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { ALL_KANA } from "@/lib/hiragana";
import { quizJsonLd } from "@/lib/jsonld";
import { PAGES, pageMetadata } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("hiragana");
}

/** The pairs that cost beginners the most time. */
const LOOKALIKES: { pair: string; tell: string }[] = [
  { pair: "あ / お", tell: "お has a dot on the right and a hook below; あ has a cross." },
  { pair: "ぬ / め", tell: "ぬ ends in a loop, め does not." },
  { pair: "る / ろ", tell: "る ends in a loop, ろ is open." },
  { pair: "わ / ね / れ", tell: "Same stem. わ hooks right, ね loops, れ flicks out." },
  { pair: "き / さ", tell: "き has two crossbars, さ has one." },
  { pair: "つ / う", tell: "つ is one flat sweep, う has a short mark on top." },
  { pair: "は / ほ", tell: "ほ has an extra horizontal bar." },
];

const FAQ: FaqItem[] = [
  {
    q: "What is hiragana?",
    a: "One of the three scripts Japanese uses. Hiragana is the rounded one, and it spells out sounds rather than meanings: 46 basic characters, each a syllable like か ka or す su. It writes grammar, verb endings and any word you would otherwise write in kanji you do not know.",
  },
  {
    q: "How is hiragana different from katakana and kanji?",
    a: "Hiragana and katakana spell the same sounds in different shapes — katakana is the angular one, used for foreign words and emphasis. Kanji are borrowed Chinese characters that carry meaning, so 山 is a mountain however you pronounce it. A normal sentence mixes all three.",
  },
  {
    q: "How long does it take to learn hiragana?",
    a: "Most people can recognise all 46 in a week of short daily sessions, and read them comfortably in two or three. Recognition comes first and is quicker than you expect; speed takes longer. Short rounds beat long ones.",
  },
  {
    q: "Which hiragana are easiest to confuse?",
    a: "あ and お, ぬ and め, る and ろ, and the family of わ, ね and れ. The quiz deliberately offers these against each other, because telling them apart is most of the work.",
  },
  {
    q: "What are the two little marks on が and ぱ?",
    a: "A dakuten ゛voices the sound — か ka becomes が ga, さ sa becomes ざ za. A handakuten ゜, the small circle, turns the h row into p: は ha becomes ぱ pa. They add 25 characters without any new shapes to learn.",
  },
  {
    q: "Why do ぢ and づ sound like じ and ず?",
    a: "They merged in modern pronunciation and survive in only a handful of words, such as つづく. They are in the chart for completeness, but the quiz leaves them out: a question asking which character makes ji would otherwise have two correct answers.",
  },
];

export default function HiraganaPage() {
  return (
    <ContentPage
      page="hiragana"
      intro={
        <>
          <p>
            Hiragana is where Japanese starts. {ALL_KANA.length} characters, each one a sound rather than a meaning —
            learn them and you can read every word on this site aloud, even the ones written in kanji, because the
            readings underneath are all hiragana.
          </p>
          <p>
            Practise three ways: see a character and pick its sound, hear a sound and pick the character, or type it
            with nothing to choose from. Start with the 46 basic characters and add the marks and combinations when
            those feel steady.
          </p>
        </>
      }
      widget={
        <>
          <HiraganaQuiz />
          <JsonLd data={quizJsonLd("hiragana", ["Hiragana", "Japanese alphabet", "Japanese writing system"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">The hiragana chart</h2>
          <p className="mt-2 text-ink/90">
            Read each grid left to right: the consonant down the side, the vowel across the top. か is k plus a, き is
            k plus i, and so on. Only や行 and わ行 have gaps.
          </p>
          <KanaChart />

          <h3 className="mt-10 text-[24px] text-primary">The ones people mix up</h3>
          <div className="my-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full border-collapse text-left">
              <caption className="px-5 pt-4 pb-2 text-left font-display text-[20px] font-black text-primary">
                How to tell them apart
              </caption>
              <thead>
                <tr className="border-b border-hairline text-[14px] text-muted">
                  <th scope="col" className="px-5 py-2 font-bold">Pair</th>
                  <th scope="col" className="px-5 py-2 font-bold">The tell</th>
                </tr>
              </thead>
              <tbody>
                {LOOKALIKES.map((l) => (
                  <tr key={l.pair} className="border-b border-hairline last:border-b-0">
                    <td lang="ja" className="jp px-5 py-2 text-[26px] whitespace-nowrap text-ink">{l.pair}</td>
                    <td className="px-5 py-2 text-[15px] leading-normal text-ink/90">{l.tell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 text-[24px] text-primary">Three sounds that are not spelled as you would guess</h3>
          <div className="mt-3 space-y-3 text-ink/90">
            <p>
              <strong className="text-ink">し is shi, not si.</strong> Likewise ち is chi and つ is tsu. These are the
              Hepburn spellings, the ones used on signs, in dictionaries and throughout this site.
            </p>
            <p>
              <strong className="text-ink">ふ is fu</strong>, a sound halfway between an f and an h, made without the
              teeth touching the lip.
            </p>
            <p>
              <strong className="text-ink">A small っ doubles the next consonant.</strong> That is why 六百 is
              ろっぴゃく, written roppyaku with two p&rsquo;s — you can see the same pause in the{" "}
              <Link href={PAGES.numbers.path} className="text-primary underline">numbers quiz</Link>.
            </p>
          </div>
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["numbers", "particles", "time"]} />}
    />
  );
}
