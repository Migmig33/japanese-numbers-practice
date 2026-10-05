"use client";

import { useEffect, useRef } from "react";
import type { Item } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Sennin } from "./Sennin";

type Props = {
  score: number;
  accuracy: number;
  longestStreak: number;
  xpEarned: number;
  leveledUp: boolean;
  level: number;
  missed: Item[];
  onPlayAgain: () => void;
  onBack: () => void;
};

export function SummaryCard(p: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const stats = [
    { label: "Score", value: p.score.toLocaleString("en") },
    { label: "Accuracy", value: `${Math.round(p.accuracy * 100)}%` },
    { label: "Longest streak", value: String(p.longestStreak) },
    { label: "XP earned", value: `+${p.xpEarned.toLocaleString("en")}` },
  ];

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <Sennin state="levelup" size={200} />
        <h2 ref={headingRef} tabIndex={-1} lang="ja" className="jp mt-4 text-jp text-primary outline-none">
          {p.leveledUp ? "レベルアップ!" : "お疲れさま!"}
        </h2>
        <p className="mt-1 text-muted">
          {p.leveledUp ? `You reached level ${p.level}.` : `Round complete — you're level ${p.level}.`}
        </p>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-hairline bg-paper px-4 py-4 text-center">
            <dt className="text-[14px] font-bold text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-[32px] font-black text-ink tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="336x280" className="my-8" />

      {p.missed.length > 0 && (
        <section aria-labelledby="review-heading">
          <h3 id="review-heading" className="font-display text-[22px] text-primary">Review these</h3>
          <ul className="mt-3 divide-y divide-hairline rounded-card border border-hairline">
            {p.missed.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
                <span lang="ja" className="jp min-w-24 text-jp text-ink">{item.jp}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{item.readings.join(" / ")}</p>
                  {item.note && <p className="text-[15px] leading-normal text-muted">{item.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-accent min-w-40" onClick={p.onPlayAgain}>Play again</button>
        <button type="button" className="btn btn-ghost min-w-40" onClick={p.onBack}>Back to sets</button>
      </div>
    </div>
  );
}
