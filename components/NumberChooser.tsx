"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  answerKanji, answerReading, buildQuestions, checkChoice, choiceNotes, type ChoiceQuestion,
} from "@/lib/compose";
import { isoDate, recordAnswer, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import type { Item, ReviewItem } from "@/lib/types";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: ChoiceQuestion[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: boolean[];
};

const RANGES = [99, 999, 9999] as const;
type Range = (typeof RANGES)[number];

const NEW_ROUND = (queue: ChoiceQuestion[]): Round => ({
  queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [],
});

const reviewItem = (q: ChoiceQuestion, notes: string[]): ReviewItem => ({
  id: q.id,
  jp: answerKanji(q),
  readings: [`${q.prompt}${q.hint ? ` (${q.hint})` : ""} · ${answerReading(q)}`],
  note: notes.join(" "),
});

/**
 * "Which kanji is it?" — the question is a number in digits and the learner picks the
 * kanji for each place in turn, four choices at a time, each labelled with its reading.
 */
export function NumberChooser() {
  const { progress } = useProgress();
  const [range, setRange] = useState<Range>(999);
  const [native, setNative] = useState(false);
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [picked, setPicked] = useState<Item[]>([]);
  const [last, setLast] = useState<{ score: AnswerScore; notes: string[]; given: string } | null>(null);
  const [missed, setMissed] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<{ leveledUp: boolean; level: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [answerCount, setAnswerCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const shownAt = useRef(0);
  const requeues = useRef(new Map<string, number>());
  const optionsRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);

  const question = round.queue[round.index];
  const stepIndex = picked.length;
  const step = question?.steps[stepIndex];
  const complete = !!question && stepIndex === question.steps.length;
  const locked = phase !== "question";

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    // Starting a round unmounts the button that had focus; pick it back up here.
    if (document.activeElement === document.body) {
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    }
    return () => window.clearInterval(id);
  }, [phase, round.index]);

  /** After a pick, move the keyboard to whatever comes next: the choices, or Check. */
  const focusNext = (done: boolean) =>
    requestAnimationFrame(() => {
      const el = done ? checkRef.current : optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
      el?.focus({ preventScroll: true });
    });

  const start = () => {
    const queue = buildQuestions(ROUND_LENGTH, { max: range, native });
    requeues.current = new Map();
    setRound(NEW_ROUND(queue));
    setPicked([]);
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  };

  const submit = useCallback(
    (skip: boolean) => {
      if (phase !== "question" || !question) return;
      const chosen = skip ? [] : picked;
      const correct = !skip && checkChoice(question, chosen);
      const ms = performance.now() - shownAt.current;
      // Per-place timing, so a four-place number isn't penalised for being longer.
      const score = scoreAnswer({ correct, ms: ms / question.steps.length, streak: round.streak });
      const notes = correct ? [] : choiceNotes(question, chosen);

      updateProgress((p) =>
        question.steps.reduce((acc, s, i) => recordAnswer(acc, s.answer.id, chosen[i]?.id === s.answer.id), p),
      );
      setRound((r) => ({
        ...r,
        queue: correct ? r.queue : requeueMissed(r.queue, r.index, { counts: requeues.current, key: (x) => x.id }),
        streak: score.streak,
        longestStreak: Math.max(r.longestStreak, score.streak),
        score: r.score + score.points,
        results: [...r.results, correct],
      }));
      if (!correct) {
        setMissed((m) => (m.some((i) => i.id === question.id) ? m : [...m, reviewItem(question, notes)]));
        setMissCount((c) => c + 1);
      }
      setLast({ score, notes, given: chosen.map((c) => c.jp).join("") });
      setAnswerCount((c) => c + 1);
      setAnnouncement(
        correct
          ? `Correct. ${answerKanji(question)}, ${answerReading(question)}. Plus ${score.points} points.`
          : `Not quite. ${question.prompt} is ${answerKanji(question)}, ${answerReading(question)}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, question, picked, round.streak],
  );

  const next = () => {
    setPicked([]);
    if (round.index + 1 < round.queue.length) {
      setRound((r) => ({ ...r, index: r.index + 1 }));
      setPhase("question");
      return;
    }
    const before = progress.level;
    const after = levelForXp(progress.xp + round.score);
    updateProgress((p) => recordRound(p, { score: round.score, date: isoDate() }));
    setSummary({ leveledUp: after > before, level: after });
    setAnnouncement(`Round complete. Score ${round.score}.`);
    setPhase("summary");
  };

  const multiplier = nextMultiplier(round.streak);
  const senninState: SenninState =
    phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : round.streak >= 3 ? "streak" : "idle";
  const correctCount = round.results.filter(Boolean).length;

  return (
    <section aria-label="Japanese numbers quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Which kanji is it?</h2>
          <p className="mt-1 text-ink/80">
            You&apos;ll see a number in digits. Pick the kanji for each place in turn — four choices at a time, each
            with its reading. Twelve numbers a round.
          </p>

          <fieldset className="mt-6">
            <legend className="mb-3 font-bold text-ink">Numbers up to</legend>
            <div className="flex flex-wrap gap-2">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={`min-h-11 rounded-full border-2 px-5 py-1.5 text-[15px] font-bold tabular-nums ${
                    range === r ? "border-primary bg-primary text-card" : "border-hairline bg-card text-primary hover:border-primary"
                  }`}
                >
                  {r.toLocaleString("en")}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 font-bold text-ink">Also practise</legend>
            <button
              type="button"
              aria-pressed={native}
              onClick={() => setNative((v) => !v)}
              className={`min-h-11 rounded-full border-2 px-5 py-1.5 text-[15px] font-bold ${
                native ? "border-primary bg-primary text-card" : "border-hairline bg-card text-primary hover:border-primary"
              }`}
            >
              <span aria-hidden="true" className="mr-1.5 inline-block w-3">{native ? "✓" : ""}</span>
              Native count (ひとつ, ふたつ…)
            </button>
          </fieldset>

          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-accent min-w-44 text-[18px]" onClick={start}>Start</button>
          </div>
        </div>
      )}

      {(phase === "question" || phase === "correct" || phase === "wrong") && question && (
        <div className="min-h-[600px] p-5 pb-8 sm:p-8">
          <QuizHud
            total={round.queue.length}
            index={round.index}
            answered={phase !== "question"}
            results={round.results}
            elapsedMs={elapsed}
            multiplier={multiplier}
            missCount={missCount}
            shake={missCount > 0 && phase === "wrong"}
          />

          <div className="mt-6 flex gap-6 max-sm:flex-col">
            <div className="flex shrink-0 justify-center sm:block">
              <Sennin key={answerCount} state={senninState} size={120} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-40 flex-col items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
                <span className="font-display text-[clamp(56px,18vw,88px)] leading-tight font-black text-ink tabular-nums sm:text-jp-test">
                  {question.prompt}
                </span>
                {question.hint && <span className="mt-1 font-bold text-muted">{question.hint}</span>}
              </div>

              <p id="chooser-label" className="mt-5 mb-2 font-bold text-ink">
                {complete
                  ? `Check your answer, or tap a ${question.unit} to change it`
                  : question.steps.length === 1
                    ? `Pick the ${question.unit}`
                    : `Pick the ${question.unit} for place ${stepIndex + 1} of ${question.steps.length}`}
              </p>

              <div
                aria-labelledby="chooser-label"
                role="group"
                className="flex min-h-[76px] flex-wrap items-center gap-2 rounded-button border-2 border-dashed border-hairline bg-paper/60 p-2"
              >
                {picked.length === 0 && <span className="px-2 text-[15px] text-muted">Your answer appears here.</span>}
                {picked.map((t, i) => (
                  <button
                    key={`${t.id}-${i}`}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setPicked((p) => p.slice(0, i));
                      focusNext(false);
                    }}
                    aria-label={`Remove ${t.jp}, ${t.readings[0]}, place ${i + 1}`}
                    className="min-h-14 rounded-button border-2 border-primary bg-card px-3 py-1 text-center"
                  >
                    <span lang="ja" className="jp block text-jp leading-none text-primary">{t.jp}</span>
                    <span className="block text-[13px] leading-tight text-muted">{t.readings[0]}</span>
                  </button>
                ))}
              </div>

              <div ref={optionsRef} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Choices">
                {step?.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setPicked((p) => [...p, o]);
                      focusNext(stepIndex + 1 === question.steps.length);
                    }}
                    className="flex min-h-24 flex-col items-center justify-center rounded-button border-2 border-b-4 border-hairline bg-card px-2 py-2 hover:border-primary"
                  >
                    <span lang="ja" className="jp text-jp leading-tight text-ink">{o.jp}</span>
                    <span className="mt-1 text-[15px] leading-tight font-bold text-muted">{o.readings.join(" / ")}</span>
                  </button>
                ))}
                {complete && (
                  <p className="col-span-2 self-center text-[15px] text-muted sm:col-span-4">
                    All {question.steps.length} place{question.steps.length > 1 ? "s" : ""} chosen.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  ref={checkRef}
                  type="button"
                  className="btn btn-primary min-w-32"
                  disabled={locked || !complete}
                  onClick={() => submit(false)}
                >
                  Check
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={locked || picked.length === 0}
                  onClick={() => {
                    setPicked([]);
                    focusNext(false);
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={locked}
                  className="ml-auto text-[15px] font-bold text-muted underline hover:text-primary disabled:no-underline"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>

          {(phase === "correct" || phase === "wrong") && last && (
            <ResultBar
              kind={phase}
              item={reviewItem(question, last.notes)}
              score={last.score}
              given={last.given}
              givenLabel="you chose"
              notes={last.notes}
              answer={
                <>
                  <span lang="ja" className="jp mr-2 inline-block align-middle text-jp whitespace-nowrap">
                    {answerKanji(question)}
                  </span>
                  <span className="align-middle">{answerReading(question)}</span>
                </>
              }
              onContinue={next}
            />
          )}
        </div>
      )}

      {phase === "summary" && summary && (
        <SummaryCard
          score={round.score}
          accuracy={round.results.length ? correctCount / round.results.length : 0}
          longestStreak={round.longestStreak}
          xpEarned={round.score}
          leveledUp={summary.leveledUp}
          level={summary.level}
          missed={missed}
          onPlayAgain={start}
          onBack={() => setPhase("picking")}
        />
      )}
    </section>
  );
}
