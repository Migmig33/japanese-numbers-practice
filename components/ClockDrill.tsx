"use client";

import { useState } from "react";
import { ClockSet } from "./ClockSet";
import { digitalTime, randomTime, sameTime, timeKanji, timeReading, type ClockTime } from "@/lib/time";

const START: ClockTime = { hour: 12, minute: 0 };
// Fixed so the prerendered HTML matches hydration; later times are random.
const FIRST: ClockTime = { hour: 3, minute: 30 };

/** "Set the clock" practice: read a Japanese time, drag the hands to match. */
export function ClockDrill() {
  const [target, setTarget] = useState<ClockTime>(FIRST);
  const [time, setTime] = useState<ClockTime>(START);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [tally, setTally] = useState({ right: 0, total: 0 });

  const check = () => {
    const ok = sameTime(time, target);
    setResult(ok ? "correct" : "wrong");
    setTally((t) => ({ right: t.right + (ok ? 1 : 0), total: t.total + 1 }));
  };

  const next = () => {
    setTarget((prev) => randomTime(Math.random, prev));
    setTime(START);
    setResult(null);
  };

  return (
    <section aria-labelledby="clock-heading" className="mt-8 rounded-card border border-hairline bg-card p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="clock-heading" className="font-display text-[26px] text-primary">Set the clock</h2>
        <p className="text-[15px] font-bold text-muted tabular-nums">{tally.right} / {tally.total} correct</p>
      </div>

      <div className="mt-6 grid items-center gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <p className="font-bold text-muted">Drag the hands to</p>
          <p lang="ja" className="jp mt-1 text-[clamp(44px,11vw,64px)] leading-tight text-ink">{timeKanji(target)}</p>
          <p className="mt-1 text-[18px] font-bold text-muted">{timeReading(target)}</p>

          <p className="mt-4 text-[15px] text-muted">
            Use a mouse or finger, or tab to a hand and use the arrow keys — Page Up and Page Down jump five minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {result === null ? (
              <button type="button" className="btn btn-primary min-w-32" onClick={check}>Check</button>
            ) : (
              <button type="button" className="btn btn-accent min-w-32" onClick={next} autoFocus>Next time</button>
            )}
            <p aria-live="polite" className={`font-bold ${result === "correct" ? "text-correct" : "text-wrong"}`}>
              {result === "correct" && `Correct — ${digitalTime(target)}.`}
              {result === "wrong" && `Not quite — it's ${digitalTime(target)}. You set ${digitalTime(time)}.`}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ClockSet value={time} onChange={setTime} disabled={result !== null} />
        </div>
      </div>
    </section>
  );
}
