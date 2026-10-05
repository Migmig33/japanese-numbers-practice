"use client";

import { useEffect, useRef } from "react";
import type { AnswerScore } from "@/lib/scoring";
import type { Item } from "@/lib/types";

type Props = {
  kind: "correct" | "wrong";
  item: Item;
  score: AnswerScore;
  /** What the user typed; empty for a skip. */
  given: string;
  onContinue: () => void;
};

/** Feedback bar that rises from the bottom of the quiz card. */
export function ResultBar({ kind, item, score, given, onContinue }: Props) {
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
              <span className="font-bold">{item.readings[0]}</span>
              <span className="ml-3 font-bold text-correct tabular-nums">
                +{score.points}
                {score.multiplier > 1 && <> (×{score.multiplier} streak)</>}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[19px] text-ink">
              The answer is <span className="font-bold">{item.readings.join(" or ")}</span>
              {given.trim() && <span className="text-muted"> — you typed “{given.trim()}”</span>}
            </p>
          )}
        </div>
        <button
          ref={buttonRef}
          type="button"
          onClick={onContinue}
          className={`btn min-w-36 ${correct ? "btn-correct" : "btn-wrong"}`}
        >
          Continue
        </button>
      </div>
      {!correct && item.note && (
        <p className="mt-4 rounded-button border-2 border-wrong/40 bg-card px-4 py-3 text-[16px] leading-relaxed text-ink">
          {item.note}
        </p>
      )}
    </div>
  );
}
