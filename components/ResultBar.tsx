"use client";

import { useEffect, useRef } from "react";
import type { AnswerScore } from "@/lib/scoring";
import type { ReviewItem } from "@/lib/types";

type Props = {
  kind: "correct" | "wrong";
  item: ReviewItem;
  score: AnswerScore;
  /** What the user typed; empty for a skip. */
  given: string;
  onContinue: () => void;
  /** Replaces the plain reading in the feedback line, e.g. kanji plus romaji. */
  answer?: React.ReactNode;
  /** The answer in hiragana, shown under the reading. */
  kana?: string;
  /** Overrides the note box; defaults to the item's note. */
  notes?: string[];
  givenLabel?: string;
};

/** Feedback bar that rises from the bottom of the quiz card. */
export function ResultBar({ kind, item, score, given, onContinue, answer, kana, notes, givenLabel = "you typed" }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const correct = kind === "correct";
  return (
    <div
      className={`animate-rise absolute inset-x-0 bottom-0 z-10 border-t-4 px-5 py-5 sm:px-8 ${
        correct ? "border-correct bg-[color-mix(in_oklab,var(--color-correct)_12%,var(--color-card))]" : "border-wrong bg-[color-mix(in_oklab,var(--color-wrong)_10%,var(--color-card))]"
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p lang="ja" className={`jp text-jp ${correct ? "text-correct" : "text-wrong"}`}>
            {correct ? "正解!" : "おしい!"}
          </p>
          {correct ? (
            <p className="mt-1 text-[19px] text-ink">
              <span className="font-bold">{answer ?? item.readings[0]}</span>
              <span className="ml-3 font-bold text-correct tabular-nums">
                +{score.points}
                {score.multiplier > 1 && <> (×{score.multiplier} streak)</>}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[19px] text-ink">
              The answer is <span className="font-bold">{answer ?? item.readings.join(" or ")}</span>
              {given.trim() && <span className="text-muted"> — {givenLabel} “{given.trim()}”</span>}
            </p>
          )}
        </div>
        {kana && (
          <p lang="ja" className="jp mt-1 w-full text-[19px] text-muted">{kana}</p>
        )}
        <button
          ref={buttonRef}
          type="button"
          onClick={onContinue}
          className={`btn min-w-36 ${correct ? "btn-correct" : "btn-wrong"}`}
        >
          Continue
        </button>
      </div>
      {!correct && (notes ?? (item.note ? [item.note] : [])).length > 0 && (
        <div className="mt-4 space-y-1 rounded-button border-2 border-wrong/40 bg-card px-4 py-3 text-[16px] leading-relaxed text-ink">
          {(notes ?? [item.note!]).map((n) => <p key={n}>{n}</p>)}
        </div>
      )}
    </div>
  );
}
