"use client";

import { SETS, itemsInSet } from "@/lib/items";
import { accuracy, type Progress } from "@/lib/progress";

const BANDS = [
  { label: "Not tried", className: "bg-hairline" },
  { label: "Under 50%", className: "bg-wrong" },
  { label: "50–79%", className: "bg-accent" },
  { label: "80% and up", className: "bg-correct" },
] as const;

function band(acc: number | null) {
  if (acc === null) return BANDS[0];
  if (acc < 0.5) return BANDS[1];
  if (acc < 0.8) return BANDS[2];
  return BANDS[3];
}

/** One cell per item, grouped by set, coloured by accuracy. */
export function MasteryHeatmap({ progress }: { progress: Progress }) {
  return (
    <div>
      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted" aria-label="Legend">
        {BANDS.map((b) => (
          <li key={b.label} className="flex items-center gap-2">
            <span className={`size-3.5 rounded-[4px] ${b.className}`} aria-hidden="true" />
            {b.label}
          </li>
        ))}
      </ul>
      <div className="space-y-5">
        {SETS.map((set) => {
          const items = itemsInSet(set.id);
          const tried = items.filter((i) => progress.items[i.id]?.attempts).length;
          return (
            <section key={set.id} aria-label={set.label}>
              <h3 className="mb-2 flex items-baseline justify-between font-sans text-[15px] font-bold text-ink">
                {set.label}
                <span className="font-normal text-muted tabular-nums">{tried} / {items.length} tried</span>
              </h3>
              <ul className="flex flex-wrap gap-1">
                {items.map((item) => {
                  const s = progress.items[item.id];
                  const acc = accuracy(s);
                  const b = band(acc);
                  const desc = s
                    ? `${item.jp} ${item.readings[0]}: ${s.correct} of ${s.attempts} correct`
                    : `${item.jp} ${item.readings[0]}: not tried`;
                  return <li key={item.id} title={desc} aria-label={desc} className={`size-5 rounded-[5px] ${b.className}`} />;
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
