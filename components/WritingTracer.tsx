"use client";

import { useState } from "react";
import { KANA_GUIDES, KANJI_GUIDES, kanaTrace, kanjiTrace, type TraceGuide } from "@/lib/strokes";
import { TraceCanvas } from "./TraceCanvas";

type Script = "kanji" | "kana";

const SCRIPTS: { id: Script; jp: string; label: string; hint: string }[] = [
  { id: "kanji", jp: "漢字", label: "Kanji", hint: "The number kanji, 一 to 万" },
  { id: "kana", jp: "ひらがな", label: "Hiragana", hint: "All 46 basic characters" },
];

/** Both scripts as tracing guides, built once rather than per render. */
const GUIDES: Record<Script, readonly TraceGuide[]> = {
  kanji: KANJI_GUIDES.map(kanjiTrace),
  kana: KANA_GUIDES.map(kanaTrace),
};

export function WritingTracer() {
  const [script, setScript] = useState<Script>("kanji");
  const [index, setIndex] = useState(0);

  const guides = GUIDES[script];
  const guide = guides[index]!;
  const isKanji = script === "kanji";

  const pick = (next: Script) => {
    setScript(next);
    setIndex(0);
  };

  return (
    <section aria-label="Writing practice" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
      <h2 className="font-display text-[26px] text-primary">What do you want to write?</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="group" aria-label="Script">
        {SCRIPTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={script === s.id}
            onClick={() => pick(s.id)}
            className={`flex items-center gap-4 rounded-button border-2 px-5 py-3 text-left ${
              script === s.id ? "border-primary bg-primary text-card" : "border-hairline bg-card hover:border-primary"
            }`}
          >
            <span lang="ja" className="jp text-[34px] leading-none">{s.jp}</span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] font-black">{s.label}</span>
              <span className={`block text-[14px] leading-snug ${script === s.id ? "text-card/80" : "text-muted"}`}>
                {s.hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      <h3 className="mt-8 font-display text-[21px] text-primary">
        {isKanji ? "Pick a kanji to trace" : "Pick a character to trace"}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={isKanji ? "Kanji" : "Hiragana"}>
        {guides.map((g, i) => (
          <button
            key={g.char}
            type="button"
            lang="ja"
            aria-pressed={i === index}
            aria-label={`${g.char}, ${g.reading}`}
            onClick={() => setIndex(i)}
            className={`jp flex items-center justify-center rounded-button border-2 ${
              isKanji ? "size-16 text-jp" : "size-12 text-[28px]"
            } ${
              i === index ? "border-primary bg-primary text-card" : "border-hairline bg-card text-ink hover:border-primary"
            }`}
          >
            {g.char}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_auto]">
        <div className="order-2 md:order-1">
          <TraceCanvas key={`${script}-${guide.char}`} guide={guide} />
        </div>
        <dl className="order-1 grid grid-cols-3 gap-3 md:order-2 md:w-48 md:grid-cols-1">
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">{isKanji ? "Kanji" : "Kana"}</dt>
            <dd lang="ja" className="jp text-jp-test text-ink max-md:text-jp">{guide.char}</dd>
          </div>
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">Reading</dt>
            <dd className="mt-1 font-display text-[24px] font-black text-primary">{guide.reading}</dd>
          </div>
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">Strokes</dt>
            <dd className="mt-1 font-display text-[24px] font-black text-primary tabular-nums">{guide.starts.length}</dd>
          </div>
        </dl>
      </div>

      {guide.note ? (
        <p className="mt-6 rounded-card border border-hairline bg-paper px-5 py-3 text-[15px] text-ink/85">{guide.note}</p>
      ) : null}

      <div className="mt-6 flex justify-between gap-3">
        <button type="button" className="btn btn-ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={index === guides.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          {isKanji ? "Next kanji" : "Next character"}
        </button>
      </div>
    </section>
  );
}
