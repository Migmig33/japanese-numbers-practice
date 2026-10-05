"use client";

type Props = {
  total: number;
  /** Index of the current question. */
  index: number;
  /** Whether the current question has been answered (feedback is showing). */
  answered: boolean;
  /** Correctness of each answered question, by position. */
  results: readonly boolean[];
  elapsedMs: number;
  multiplier: number;
  /** Increments on every miss; replays the badge shake. */
  missCount: number;
  shake: boolean;
};

/** Segmented progress bar, per-question timer and streak multiplier badge. */
export function QuizHud({ total, index, answered, results, elapsedMs, multiplier, missCount, shake }: Props) {
  const done = answered ? index + 1 : index;
  return (
    <div className="flex items-center gap-4">
      <ol
        className="grid flex-1 gap-1"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        aria-label={`Question ${index + 1} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => {
          const r = results[i];
          const color = i < done && r !== undefined ? (r ? "bg-correct" : "bg-wrong") : i === index ? "bg-primary" : "bg-hairline";
          return <li key={i} className={`h-2.5 rounded-full ${color}`} aria-hidden="true" />;
        })}
      </ol>
      <span className="w-16 text-right text-[15px] font-bold text-muted tabular-nums" aria-label="Time on this question">
        {(elapsedMs / 1000).toFixed(1)}s
      </span>
      <span
        key={missCount}
        className={`rounded-full px-3 py-0.5 font-display text-[18px] font-black tabular-nums ${
          multiplier > 1 ? "bg-accent text-ink" : "bg-hairline text-muted"
        } ${shake ? "animate-shake" : ""}`}
        aria-label={`Streak multiplier ×${multiplier}`}
      >
        ×{multiplier}
      </span>
    </div>
  );
}
