import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ContentPage } from "@/components/PageShell";
import { NumbersQuiz } from "@/components/NumbersQuiz";
import { ReferenceTable } from "@/components/ReferenceTable";
import { RelatedCards } from "@/components/RelatedCards";
import { ITEMS_BY_ID, itemsInSet } from "@/lib/items";
import { quizJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("numbers");
}

const FAQ: FaqItem[] = [
  {
    q: "How do you count from 1 to 10 in Japanese?",
    a: "ichi, ni, san, yon (or shi), go, roku, nana (or shichi), hachi, kyuu (or ku), juu. Learn these ten first — every bigger number is built from them.",
  },
  {
    q: "Why do 4, 7 and 9 have two readings?",
    a: "Japanese numbers mix readings borrowed from Chinese with native ones, and for these three both survive in everyday use. Shi sounds like the word for death and ku like the word for suffering, so yon and kyuu are the safer defaults when counting. The quiz accepts both.",
  },
  {
    q: "Why is 300 sanbyaku and 600 roppyaku?",
    a: "Sound changes. After san the h of hyaku softens to b, giving sanbyaku. After roku and hachi the two sounds merge into a doubled p: roppyaku and happyaku. Thousands do the same thing: sanzen for 3,000 and hassen for 8,000.",
  },
  {
    q: "How do you say 10,000 in Japanese?",
    a: "Ichiman. Japanese groups large numbers by four digits, so 10,000 gets its own word, man — but it always needs the ichi in front. 100 and 1,000 are different: they are just hyaku and sen on their own.",
  },
  {
    q: "What are hitotsu, futatsu, mittsu?",
    a: "The native Japanese numbers, used to count things in general when you don't know a specific counter. They only go up to ten: hitotsu, futatsu, mittsu, yottsu, itsutsu, muttsu, nanatsu, yattsu, kokonotsu, too.",
  },
  {
    q: "How do the three stages work?",
    a: "Stage 1 gives you a number and four kanji choices per place. Stage 2 turns it round: you see the kanji and pick the number it means. Stage 3 drops the options — you type the reading yourself. Each round is twelve numbers, and 70% opens the next stage.",
  },
  {
    q: "How do you say big numbers like 1,000,000 in Japanese?",
    a: "Japanese groups digits in fours, not threes. 万 is 10,000 and 億 is 100,000,000, so 1,000,000 is 百万 hyakuman — literally a hundred ten-thousands — and 1,000,000,000 is 十億 juuoku. That regrouping, not the readings, is what makes large numbers hard.",
  },
];

export default function NumbersQuizPage() {
  const sound = ["hundreds-300", "hundreds-600", "hundreds-800", "thousands-3000", "thousands-8000", "tenthousands-10000"]
    .map((id) => ITEMS_BY_ID.get(id)!);

  return (
    <ContentPage
      page="numbers"
      intro={
        <p>
Three stages, each a different way round. Build a number from kanji, read kanji back as a number, then
          type the reading from memory — all the way to 十億, a thousand million. Get 70% of a round right and the
          next stage opens. Every round slips in a few numbers whose zeros are the whole lesson, like 10, 2,000 and
          一万, because that is where the four-digit grouping bites.
        </p>
      }
      widget={
        <>
          <NumbersQuiz />
          <JsonLd data={quizJsonLd("numbers", ["Japanese numbers", "Japanese numerals", "Kanji numbers"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Japanese numbers chart</h2>
          <p className="mt-2 text-ink/90">The building blocks, then the sound changes that trip everyone up.</p>
          <ReferenceTable caption="1 to 10" items={itemsInSet("ones")} />
          <ReferenceTable caption="Sound changes to remember" items={sound} showNotes />
          <ReferenceTable caption="Hundreds" items={itemsInSet("hundreds")} />
          <ReferenceTable caption="Thousands" items={itemsInSet("thousands")} />
          <ReferenceTable caption="Native numbers (counting things)" items={itemsInSet("native")} />
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["time", "writing", "progress"]} />}
    />
  );
}
