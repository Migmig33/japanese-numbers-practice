"use client";

import { useEffect, useRef } from "react";
import type { AnswerScore } from "@/lib/scoring";
import type { ReviewItem } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";

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
  /**
   * The Japanese to read aloud, in kana or full script — never romaji. Pass it and the
   * answer speaks itself the moment this bar appears, with a button to hear it again.
   * Prefer kana over kanji where the two differ: 四時 is read yoji, but a synthesiser
   * handed the kanji may well say yonji, and the whole point is the sound.
   */
  speak?: string;
  /** For screen readers, e.g. "the reading, roppyaku". Defaults to "the answer". */
  speakLabel?: string;
};

/** Feedback bar that rises from the bottom of the quiz card. */
export function ResultBar({
  kind, item, score, given, onContinue, answer, kana, notes, givenLabel = "you typed", speak, speakLabel,
}: Props) {
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
        <div className="flex min-w-0 items-center gap-3">
          {speak && (
            <SpeakButton
              /* Mounts with the bar, so each revealed answer is spoken exactly once. */
              key={item.id}
              id={`answer-${item.id}`}
              text={speak}
              label={speakLabel ?? "the answer"}
              size={40}
              autoPlay
            />
          )}
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
