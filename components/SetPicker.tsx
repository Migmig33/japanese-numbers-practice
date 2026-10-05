"use client";

import { SETS } from "@/lib/items";
import type { SetId } from "@/lib/types";

const GROUPS = [
  { id: "numbers", jp: "数字", en: "Numbers" },
  { id: "time", jp: "時間", en: "Time" },
] as const;

type Props = {
  selected: ReadonlySet<SetId>;
  count: number;
  onToggle: (id: SetId) => void;
  onClear: () => void;
  onStart: () => void;
};

export function SetPicker({ selected, count, onToggle, onClear, onStart }: Props) {
  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-[26px] text-primary">Choose what to practise</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={selected.size === 0}
          className="text-[15px] font-bold text-primary underline disabled:text-muted disabled:no-underline"
        >
          Uncheck all
        </button>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {GROUPS.map((g) => (
          <fieldset key={g.id}>
            <legend className="mb-3 flex items-baseline gap-3">
              <span lang="ja" className="jp text-jp text-ink">{g.jp}</span>
              <span className="font-bold text-muted">{g.en}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {SETS.filter((s) => s.group === g.id).map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(s.id)}
                    className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-[15px] font-bold transition-colors ${
                      on
                        ? "border-primary bg-primary text-card"
                        : "border-hairline bg-card text-primary hover:border-primary"
                    }`}
                  >
                    <span aria-hidden="true" className="mr-1.5 inline-block w-3">{on ? "✓" : ""}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" className="btn btn-accent min-w-44 text-[18px]" onClick={onStart} disabled={count === 0}>
          <span className="tabular-nums">{`Start (${count})`}</span>
        </button>
      </div>
    </div>
  );
}
