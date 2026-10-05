"use client";

import { useState } from "react";
import { itemsInSet, kanjiNumber } from "@/lib/items";
import { ClockSet, type ClockTime } from "./ClockSet";

const HOUR_JP = itemsInSet("hours").map((i) => i.jp);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Target = ClockTime & { jp: string };

function randomTarget(prev?: Target): Target {
  for (;;) {
    const hour = 1 + Math.floor(Math.random() * 12);
    const minute = MINUTES[Math.floor(Math.random() * MINUTES.length)]!;
    if (prev && prev.hour === hour && prev.minute === minute) continue;
    const m = minute === 0 ? "" : minute === 30 ? "半" : `${kanjiNumber(minute)}分`;
    return { hour, minute, jp: `${HOUR_JP[hour - 1]}${m}` };
  }
}

const fmt = (t: ClockTime) => `${t.hour}:${String(t.minute).padStart(2, "0")}`;

/** "Set the clock" practice: read a Japanese time, drag the hands to match. */
export function ClockDrill() {
  const [target, setTarget] = useState<Target | null>(null);
  const [time, setTime] = useState<ClockTime>({ hour: 12, minute: 0 });
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [tally, setTally] = useState({ right: 0, total: 0 });

  // Picked on the client so the prerendered HTML doesn't disagree with hydration.
  const current = target ?? { hour: 3, minute: 30, jp: `${HOUR_JP[2]}半` };

  const check = () => {
    const ok = time.hour === current.hour && time.minute === current.minute;
    setResult(ok ? "correct" : "wrong");
    setTally((t) => ({ right: t.right + (ok ? 1 : 0), total: t.total + 1 }));
  };

  const next = () => {
    setTarget(randomTarget(current));
    setTime({ hour: 12, minute: 0 });
    setResult(null);
  };

  return (
    <section aria-labelledby="clock-heading" className="mt-8 rounded-card border border-hairline bg-card p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="clock-heading" className="font-display text-[26px] text-primary">Set the clock</h2>
        <p className="text-[15px] font-bold text-muted tabular-nums">
          {tally.right} / {tally.total} correct
        </p>
      </div>
      <div className="mt-6 grid items-center gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <p className="font-bold text-muted">Drag the hands to</p>
          <p lang="ja" className="jp mt-1 text-[clamp(48px,12vw,72px)] leading-tight text-ink">{current.jp}</p>
          <p className="mt-4 text-[15px] text-muted">
            Use a mouse or finger, or tab to a hand and use the arrow keys. Minutes snap to five.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {result === null ? (
              <button type="button" className="btn btn-primary min-w-32" onClick={check}>Check</button>
            ) : (
              <button type="button" className="btn btn-accent min-w-32" onClick={next} autoFocus>Next time</button>
            )}
            <p aria-live="polite" className={`font-bold ${result === "correct" ? "text-correct" : "text-wrong"}`}>
              {result === "correct" && `Correct — ${fmt(current)}.`}
              {result === "wrong" && `Not quite — it's ${fmt(current)}. You set ${fmt(time)}.`}
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
