"use client";

import { gradeFor } from "@/lib/modes";

/** The round's grade, shown on the summary for whichever mode was played. */
export function GradeCard({
  modeName, accuracy, correct, total,
}: {
  modeName: string;
  accuracy: number;
  correct: number;
  total: number;
}) {
  const grade = gradeFor(accuracy);
  const good = accuracy >= 0.7;
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-card border-2 px-5 py-4 ${
        good ? "border-correct/40 bg-correct/10" : "border-accent/50 bg-accent/10"
      }`}
    >
      <span
        aria-hidden="true"
        className={`font-display text-[52px] leading-none font-black ${good ? "text-correct" : "text-ink"}`}
      >
        {grade.letter}
      </span>
      <span className="text-left">
        <span className="block font-display text-[19px] font-black text-ink">
          {grade.label} — {modeName}
        </span>
        <span className="block text-[15px] text-muted tabular-nums">
          {correct} of {total} right, {Math.round(accuracy * 100)}%
        </span>
      </span>
    </div>
  );
}

/** Easy / Medium / Hard pill for a mode card. */
export function DifficultyBadge({ level }: { level: "Easy" | "Medium" | "Hard" }) {
  const tone =
    level === "Easy"
      ? "bg-correct/15 text-correct"
      : level === "Medium"
        ? "bg-accent/25 text-ink"
        : "bg-wrong/15 text-wrong";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${tone}`}>
      {level}
    </span>
  );
}
