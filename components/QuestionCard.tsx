"use client";

import { forwardRef } from "react";
import type { Item } from "@/lib/types";

type Props = {
  item: Item;
  value: string;
  locked: boolean;
  onChange: (v: string) => void;
  onCheck: () => void;
  onSkip: () => void;
};

/** The character under test, the answer input, Check and Skip. */
export const QuestionCard = forwardRef<HTMLInputElement, Props>(function QuestionCard(
  { item, value, locked, onChange, onCheck, onSkip },
  inputRef,
) {
  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked && value.trim()) onCheck();
      }}
    >
      <div className="flex min-h-40 items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
        <span lang="ja" className="jp text-center text-[clamp(52px,17vw,88px)] leading-tight text-ink sm:text-jp-test">
          {item.jp}
        </span>
      </div>
      <label htmlFor="quiz-answer" className="mt-5 mb-2 font-bold text-ink">
        Type the reading
      </label>
      <div className="flex gap-3 max-sm:flex-col">
        <input
          ref={inputRef}
          id="quiz-answer"
          type="text"
          lang="en"
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="e.g. roppyaku"
          className="min-h-13 min-w-0 flex-1 rounded-button border-2 border-hairline bg-card px-4 text-[20px] text-ink placeholder:text-muted/60 focus:border-primary"
        />
        <button type="submit" className="btn btn-primary min-w-32" disabled={locked || !value.trim()}>
          Check
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        disabled={locked}
        className="mt-3 self-start text-[15px] font-bold text-muted underline hover:text-primary disabled:no-underline"
      >
        Skip
      </button>
    </form>
  );
});
