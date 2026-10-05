"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ITEMS } from "@/lib/items";
import { isoDate, useProgress } from "@/lib/progress";
import { xpForLevel } from "@/lib/scoring";
import { PAGES } from "@/lib/site";
import { getLeeches } from "@/lib/srs";
import { MasteryHeatmap } from "./MasteryHeatmap";

const WEEKS = 12;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Consecutive practice days ending today (or yesterday, if today isn't done yet). */
function currentStreak(days: ReadonlySet<string>, today: Date) {
  let d = days.has(isoDate(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(isoDate(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

const noop = () => () => {};

export function ProgressDashboard() {
  const { progress } = useProgress();
  // Dates only make sense on the client; the prerendered page shows an empty calendar.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const days = new Set(progress.days);
  const today = new Date();
  const streak = hydrated ? currentStreak(days, today) : 0;
  const nextLevelXp = xpForLevel(progress.level + 1);
  const levelStart = xpForLevel(progress.level);
  const pct = Math.min(1, (progress.xp - levelStart) / (nextLevelXp - levelStart));
  const leeches = getLeeches(progress, ITEMS);

  // Calendar: WEEKS columns of Mon–Sun, ending with the current week.
  const start = addDays(today, -((today.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));

  const stats = [
    { label: "Level", value: String(progress.level) },
    { label: "Total XP", value: progress.xp.toLocaleString("en") },
    { label: "Best score", value: progress.bestScore.toLocaleString("en") },
    { label: "Rounds played", value: progress.roundsPlayed.toLocaleString("en") },
    { label: "Day streak", value: String(streak) },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="stats-heading" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
        <h2 id="stats-heading" className="font-display text-[26px] text-primary">Stats</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card bg-paper px-4 py-4 text-center">
              <dt className="text-[14px] font-bold text-muted">{s.label}</dt>
              <dd className="mt-1 font-display text-[30px] font-black text-ink tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <div className="flex justify-between text-[14px] text-muted tabular-nums">
            <span>Level {progress.level}</span>
            <span>{(nextLevelXp - progress.xp).toLocaleString("en")} XP to level {progress.level + 1}</span>
          </div>
          <div
            className="mt-1 h-3 overflow-hidden rounded-full bg-hairline"
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct * 100)}
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
        {progress.roundsPlayed === 0 && (
          <p className="mt-5 text-ink/80">
            Nothing here yet — play a round of the{" "}
            <Link href={PAGES.numbers.path} className="text-primary underline">numbers quiz</Link> or the{" "}
            <Link href={PAGES.time.path} className="text-primary underline">time quiz</Link> and your stats will appear.
          </p>
        )}
      </section>

      <section aria-labelledby="calendar-heading" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
        <h2 id="calendar-heading" className="font-display text-[26px] text-primary">Practice calendar</h2>
        <p className="mt-1 text-[15px] text-muted">The last {WEEKS} weeks. A filled square is a day you finished a round.</p>
        <div className="mt-4 overflow-x-auto">
          {!hydrated ? (
            <div className="h-[164px]" aria-hidden="true" />
          ) : (
          <div className="flex gap-1" role="list" aria-label="Practice days">
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-1">
                {week.map((d) => {
                  const iso = isoDate(d);
                  const done = days.has(iso);
                  const future = d > today;
                  return (
                    <span
                      key={iso}
                      role="listitem"
                      title={iso}
                      aria-label={`${iso}: ${done ? "practised" : "no practice"}`}
                      className={`size-5 rounded-[5px] ${done ? "bg-correct" : future ? "bg-transparent" : "bg-hairline"}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      <section aria-labelledby="mastery-heading" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
        <h2 id="mastery-heading" className="font-display text-[26px] text-primary">Mastery</h2>
        <p className="mt-1 mb-4 text-[15px] text-muted">Every item in every set, coloured by how often you get it right.</p>
        <MasteryHeatmap progress={progress} />
      </section>

      <section id="review" aria-labelledby="review-heading" className="rounded-card border border-hairline bg-card p-5 sm:p-8">
        <h2 id="review-heading" className="font-display text-[26px] text-primary">Items to review</h2>
        <p className="mt-1 text-[15px] text-muted">Under 50% correct after four or more tries.</p>
        {leeches.length === 0 ? (
          <p className="mt-4 text-ink/80">None right now.</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline rounded-card border border-hairline">
            {leeches.map((item) => {
              const s = progress.items[item.id]!;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
                  <span lang="ja" className="jp min-w-24 text-jp text-ink">{item.jp}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{item.readings.join(" / ")}</p>
                    {item.note && <p className="text-[15px] leading-normal text-muted">{item.note}</p>}
                  </div>
                  <span className="text-[14px] text-muted tabular-nums">{s.correct} / {s.attempts}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
