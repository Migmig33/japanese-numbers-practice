import type { Metadata } from "next";
import Link from "next/link";
import { Faq, type FaqItem } from "@/components/Faq";
import { HiraganaQuiz } from "@/components/HiraganaQuiz";
import { JsonLd } from "@/components/JsonLd";
import { KanaChart } from "@/components/KanaChart";
import { SpeechNotice } from "@/components/SpeakButton";
import { ContentPage } from "@/components/PageShell";
import { RelatedCards } from "@/components/RelatedCards";
import { quizJsonLd } from "@/lib/jsonld";
import { PAGES, pageMetadata } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("katakana");
}

const FAQ: FaqItem[] = [
  {
    q: "What is katakana?",
    a: "Katakana is one of the three scripts Japanese uses. Its 46 basic sounds match hiragana, but the shapes are angular and are commonly used for foreign words, names, sound effects, and emphasis.",
  },
  {
    q: "How is katakana different from hiragana?",
    a: "They represent the same basic sounds in different shapes. Hiragana is common for grammar and native Japanese words; katakana is common for loanwords and foreign names. A normal sentence can use both.",
  },
  {
    q: "How long does it take to learn katakana?",
    a: "Most learners can recognise the 46 basic characters in a week of short daily practice. The quiz lets you start with the basic set, then add voiced sounds and combinations.",
  },
  {
    q: "Which katakana are easiest to confuse?",
    a: "シ and ツ, ソ and ン, and ク and ケ are common look-alikes. Compare the direction and placement of their short strokes rather than memorising them as isolated pictures.",
  },
  {
    q: "What are the two little marks on ガ and パ?",
    a: "A dakuten ゛voices a sound: カ ka becomes ガ ga. A handakuten ゜turns the h row into p: ハ ha becomes パ pa.",
  },
  {
    q: "What are small ャ, ュ, and ョ for?",
    a: "They combine with an i-row character to make sounds such as キャ kya, シュ shu, and チョ cho. The smaller character is read together with the first one.",
  },
];

export default function KatakanaPage() {
  return (
    <ContentPage
      page="katakana"
      intro={
        <>
          <p>
            Katakana gives Japanese its angular script for loanwords, foreign names, sound effects, and emphasis.
            Start with the 46 basic characters, then add the marks and combinations.
          </p>
          <p>
            Practise three ways: see a character and pick its sound, hear a sound and pick the character, or type it
            from memory. Every chart cell can also read the character aloud.
          </p>
        </>
      }
      widget={
        <>
          <HiraganaQuiz script="katakana" />
          <JsonLd data={quizJsonLd("katakana", ["Katakana", "Japanese alphabet", "Japanese writing system"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Katakana chart</h2>
          <p className="mt-2 text-ink/90">
            Read each grid left to right: the consonant down the side, the vowel across the top. カ is k plus a,
            キ is k plus i, and so on. Press any character to hear it said aloud.
          </p>
          <SpeechNotice className="my-6" />
          <KanaChart script="katakana" />
          <h3 className="mt-10 text-[24px] text-primary">Katakana in context</h3>
          <p className="mt-3 text-ink/90">
            Katakana appears in borrowed words such as コーヒー (coffee), names, and onomatopoeia. Once the shapes
            feel familiar, switch to the <Link href={PAGES.hiragana.path} className="text-primary underline">hiragana quiz</Link>
            to learn the matching rounded script.
          </p>
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["hiragana", "numbers", "time"]} />}
    />
  );
}
