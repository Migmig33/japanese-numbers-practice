import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ContentPage } from "@/components/PageShell";
import { ParticleChart } from "@/components/ParticleChart";
import { ParticleQuiz } from "@/components/ParticleQuiz";
import { RelatedCards } from "@/components/RelatedCards";
import { quizJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/site";

export function generateMetadata(): Metadata {
  return pageMetadata("particles");
}

const FAQ: FaqItem[] = [
  {
    q: "What is a particle in Japanese?",
    a: "A short word that follows a noun and says what job it is doing in the sentence. English uses word order and prepositions for this — 'I eat bread' — while Japanese tags each part instead: パンを食べます, where を marks bread as the thing being eaten. That tagging is why Japanese word order can move around so freely.",
  },
  {
    q: "Why is は written ha but said wa?",
    a: "Because of a spelling reform that left the particle behind. When は is a particle it is always said wa, and when it is part of a word — はし, chopsticks — it is said ha. The same happens with へ, said e as a particle, and を, said o.",
  },
  {
    q: "What is the difference between は and が?",
    a: "Roughly: は sets the topic, what you are talking about, while が points at the subject, often something new or specific. わたしは学生です introduces you as the topic. 犬がいます announces that a dog is there. The verbs あります, います and the word すき always take が.",
  },
  {
    q: "What is the difference between に and で?",
    a: "に is where something is, で is where something happens. きょうしつに先生がいます — the teacher is in the classroom. 図書館で本を読みます — I read books at the library. If there is an action, reach for で.",
  },
  {
    q: "Do I need a particle after a time?",
    a: "Clock times and dates take に: 三時に会いましょう. Words that are relative to now do not — きょう, あした and まいにち take no に at all. 'Today is Monday' is きょうは月曜日です, with は, because today is the topic.",
  },
  {
    q: "Is it true that particles can be dropped?",
    a: "In casual speech は, が and を are often left out when the meaning is obvious: パン食べる? for 'eating bread?'. Learn them in full first — written Japanese, polite speech and exams all expect them, and you can only drop what you know is there.",
  },
];

export default function ParticlesPage() {
  return (
    <ContentPage
      page="particles"
      intro={
        <p>
          Particles are the small words that say what each part of a sentence is doing — which noun is the topic, which
          is being acted on, where, when and with what. Get them right and Japanese word order stops mattering nearly so
          much. Practise them two ways: fill the gap in a sentence, or put a sentence together piece by piece.
        </p>
      }
      widget={
        <>
          <ParticleQuiz />
          <JsonLd data={quizJsonLd("particles", ["Japanese particles", "Japanese grammar", "wa ga wo ni de"])} />
        </>
      }
      reference={
        <section aria-labelledby="reference">
          <h2 id="reference" className="mt-4 text-[30px] text-primary">Particle chart</h2>
          <p className="mt-2 text-ink/90">
            The eleven you meet first, each with its reading underneath. Press a listen button to hear it — note how
            は, を and へ are said differently from how they are written.
          </p>
          <ParticleChart />

          <h3 className="mt-10 text-[24px] text-primary">The three that trip everyone up</h3>
          <div className="mt-3 space-y-4 text-ink/90">
            <p>
              <strong className="text-ink">は against が.</strong> は says &ldquo;as for this&rdquo; and sets the topic;
              が picks out the subject, often something new to the conversation. When something simply exists — います,
              あります — or is liked — すき — it takes が.
            </p>
            <p>
              <strong className="text-ink">に against で.</strong> に is a position: a point in time, a destination, or
              where something sits. で is the scene of an action, or the tool you use. Eating happens at home, so
              うちで食べます; the teacher merely is in the classroom, so きょうしつにいます.
            </p>
            <p>
              <strong className="text-ink">を against が.</strong> を is for what the verb does something to. The
              exception worth memorising early is すき, which takes が even though English says &ldquo;like
              something&rdquo;: 日本語がすきです.
            </p>
          </div>
        </section>
      }
      faq={<Faq items={FAQ} />}
      related={<RelatedCards pages={["numbers", "time", "progress"]} />}
    />
  );
}
