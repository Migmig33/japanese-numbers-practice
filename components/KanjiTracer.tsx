"use client";

import { useState } from "react";
import { KANJI_GUIDES } from "@/lib/strokes";
import { TraceCanvas } from "./TraceCanvas";

export function KanjiTracer() {
  const [index, setIndex] = useState(0);
  const guide = KANJI_GUIDES[index]!;

  return (
    <section aria-label="Kanji tracing" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
      <h2 className="font-display text-[26px] text-primary">Pick a kanji to trace</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Kanji">
        {KANJI_GUIDES.map((g, i) => (
          <button
            key={g.char}
            type="button"
            lang="ja"
            aria-pressed={i === index}
            aria-label={`${g.char}, ${g.value.toLocaleString("en")}`}
            onClick={() => setIndex(i)}
            className={`jp flex size-16 items-center justify-center rounded-button border-2 text-jp ${
              i === index ? "border-primary bg-primary text-card" : "border-hairline bg-card text-ink hover:border-primary"
            }`}
          >
            {g.char}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_auto]">
        <div className="order-2 md:order-1">
          <TraceCanvas key={guide.char} guide={guide} />
        </div>
        <dl className="order-1 grid grid-cols-3 gap-3 md:order-2 md:w-48 md:grid-cols-1">
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">Kanji</dt>
            <dd lang="ja" className="jp text-jp-test text-ink max-md:text-jp">{guide.char}</dd>
          </div>
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">Reading</dt>
            <dd className="mt-1 font-display text-[24px] font-black text-primary">{guide.reading}</dd>
          </div>
          <div className="rounded-card bg-paper px-4 py-3 text-center">
            <dt className="text-[14px] font-bold text-muted">Strokes</dt>
            <dd className="mt-1 font-display text-[24px] font-black text-primary tabular-nums">{guide.strokes.length}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button type="button" className="btn btn-ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={index === KANJI_GUIDES.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next kanji
        </button>
      </div>
    </section>
  );
}
