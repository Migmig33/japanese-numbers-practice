"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { answerKana, answerKanji, answerReading, checkChoice, choiceNotes } from "@/lib/compose";
import { numberKana } from "@/lib/bignumbers";
import { isoDate, recordAnswer, recordGrade, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import {
  buildModeRound, checkAnswer, gradeFor, MODE_IDS, MODES, type ModeId, type Question,
} from "@/lib/modes";
import type { Item, ReviewItem } from "@/lib/types";
import { DifficultyBadge, GradeCard } from "./GradeCard";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: Question[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: boolean[];
};

const NEW_ROUND = (queue: Question[]): Round => ({
  queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [],
});

const num = (n: number) => n.toLocaleString("en");

/** How a question's answer reads, for feedback and the review list. */
function answerOf(q: Question): { kanji: string; reading: string; kana: string; prompt: string } {
  if (q.kind === "build") {
    return { kanji: answerKanji(q), reading: answerReading(q), kana: answerKana(q), prompt: q.prompt };
  }
  return { kanji: q.kanji, reading: q.reading, kana: numberKana(q.n), prompt: num(q.n) };
}

function reviewItem(q: Question, notes: string[]): ReviewItem {
  const a = answerOf(q);
  return { id: q.id, jp: a.kanji, readings: [`${a.prompt} · ${a.reading}`], note: notes.join(" ") };
}

export function NumbersQuiz() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<ModeId>("build");
  const [native, setNative] = useState(false);
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [picked, setPicked] = useState<Item[]>([]);
  const [typed, setTyped] = useState("");
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
  const inputRef = useRef<HTMLInputElement>(null);

  const question = round.queue[round.index];
  const stepIndex = picked.length;
  const step = question?.kind === "build" ? question.steps[Math.min(stepIndex, question.steps.length - 1)] : undefined;
  const locked = phase !== "question";

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    if (question?.kind === "recall") inputRef.current?.focus({ preventScroll: true });
    else if (document.activeElement === document.body) {
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    }
    return () => window.clearInterval(id);
  }, [phase, round.index, question?.kind]);

  const focusOptions = () =>
    requestAnimationFrame(() =>
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }),
    );

  const start = (m: ModeId = mode) => {
    setMode(m);
    requeues.current = new Map();
    setRound(NEW_ROUND(buildModeRound(m, { native, length: ROUND_LENGTH })));
    setPicked([]);
    setTyped("");
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  };

  /**
   * Marks the answer. The answer is passed in rather than read from state, because the
   * final pick submits the question and that update has not landed yet.
   */
  const submit = useCallback(
    (given: readonly Item[] | number | string | null) => {
      if (phase !== "question" || !question) return;

      let correct = false;
      let notes: string[] = [];
      let shown = "";

      if (question.kind === "build") {
        const chosen = Array.isArray(given) ? (given as Item[]) : [];
        correct = chosen.length > 0 && checkChoice(question, chosen);
        notes = correct ? [] : choiceNotes(question, chosen);
        shown = chosen.map((c) => c.jp).join("");
        updateProgress((p) =>
          question.steps.reduce((acc, s, i) => recordAnswer(acc, s.answer.id, chosen[i]?.id === s.answer.id), p),
        );
      } else {
        const value = typeof given === "number" || typeof given === "string" ? given : null;
        correct = checkAnswer(question, value);
        shown = value === null ? "" : typeof value === "number" ? num(value) : value.trim();
        const a = answerOf(question);
        if (!correct) {
          notes =
            question.kind === "identify"
              ? [`${a.kanji} is ${a.prompt} — ${a.reading}.`]
              : [`${a.prompt} is ${a.kanji} — ${a.reading}.`];
          if (String(question.n).includes("0")) {
            notes.push("Japanese groups digits in fours: 万 is 10,000 and 億 is 100,000,000.");
          }
        }
      }

      const ms = performance.now() - shownAt.current;
      const perPart = question.kind === "build" ? question.steps.length : 1;
      const score = scoreAnswer({ correct, ms: ms / perPart, streak: round.streak });

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
      setLast({ score, notes, given: shown });
      setAnswerCount((c) => c + 1);
      const a = answerOf(question);
      setAnnouncement(
        correct
          ? `Correct. ${a.kanji}, ${a.reading}. Plus ${score.points} points.`
          : `Not quite. ${a.prompt} is ${a.kanji}, ${a.reading}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, question, round.streak],
  );

  const next = () => {
    setPicked([]);
    setTyped("");
    if (round.index + 1 < round.queue.length) {
      setRound((r) => ({ ...r, index: r.index + 1 }));
      setPhase("question");
      return;
    }
    const correct = round.results.filter(Boolean).length;
    const scored = round.results.length ? correct / round.results.length : 0;
    const before = progress.level;
    const after = levelForXp(progress.xp + round.score);
    updateProgress((p) => recordGrade(recordRound(p, { score: round.score, date: isoDate() }), mode, scored));
    setSummary({ leveledUp: after > before, level: after });
    setAnnouncement(`Round complete. Score ${round.score}.`);
    setPhase("summary");
  };

  const multiplier = nextMultiplier(round.streak);
  const senninState: SenninState =
    phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : round.streak >= 3 ? "streak" : "idle";
  const correctCount = round.results.filter(Boolean).length;
  const accuracy = round.results.length ? correctCount / round.results.length : 0;
  const answer = question ? answerOf(question) : null;

  return (
    <section aria-label="Japanese numbers quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Pick how you want to practise</h2>
          <p className="mt-1 text-ink/80">
            All three are open — take them in any order. Each round is {ROUND_LENGTH} numbers, always including a few
            whose zeros are the whole lesson, and you get a grade at the end.
          </p>

          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {MODE_IDS.map((id) => {
              const m = MODES[id];
              const best = progress.grades[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    aria-describedby={`mode-${id}-blurb`}
                    className="flex h-full w-full flex-col rounded-card border-2 border-hairline bg-card p-5 text-left transition-colors hover:border-primary"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[19px] font-black text-ink">{m.name}</span>
                      <DifficultyBadge level={m.difficulty} />
                      {best !== undefined && (
                        <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-display text-[14px] font-black text-ink">
                          Best {gradeFor(best).letter}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 font-bold text-primary">{m.task}</span>
                    <span id={`mode-${id}-blurb`} className="mt-1 text-[15px] leading-normal text-muted">
                      {m.blurb}
                    </span>
                    <span lang="ja" className="jp mt-3 text-[17px] text-ink">{m.sample}</span>
                    <span className="mt-3 text-[14px] font-bold text-muted tabular-nums">Up to {num(m.max)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <fieldset className="mt-6">
            <legend className="mb-3 font-bold text-ink">Extra for “Build it”</legend>
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
        </div>
      )}

      {(phase === "question" || phase === "correct" || phase === "wrong") && question && answer && (
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
          <p className="mt-2 text-[14px] font-bold text-muted">
            {MODES[mode].name} — {MODES[mode].task}
          </p>

          <div className="mt-4 flex gap-6 max-sm:flex-col">
            <div className="flex shrink-0 justify-center sm:block">
              <Sennin key={answerCount} state={senninState} size={120} />
            </div>
            <div className="min-w-0 flex-1">
              {/* The prompt: digits for build and recall, kanji for identify. */}
              <div className="flex min-h-40 flex-col items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
                {question.kind === "identify" ? (
                  <span lang="ja" className="jp text-center text-[clamp(40px,11vw,72px)] leading-tight text-ink">
                    {question.kanji}
                  </span>
                ) : (
                  <span className="font-display text-center text-[clamp(40px,12vw,72px)] leading-tight font-black text-ink tabular-nums">
                    {question.kind === "build" ? question.prompt : num(question.n)}
                  </span>
                )}
                {question.kind === "build" && question.hint && (
                  <span className="mt-1 font-bold text-muted">{question.hint}</span>
                )}
              </div>

              {question.kind === "build" && (
                <BuildBody
                  question={question}
                  picked={picked}
                  step={step}
                  locked={locked}
                  optionsRef={optionsRef}
                  onRewind={(i) => {
                    setPicked((p) => p.slice(0, i));
                    focusOptions();
                  }}
                  onPick={(o) => {
                    const chosen = [...picked, o];
                    setPicked(chosen);
                    if (chosen.length === question.steps.length) submit(chosen);
                    else focusOptions();
                  }}
                />
              )}

              {question.kind === "identify" && (
                <>
                  <p id="q-label" className="mt-5 mb-2 font-bold text-ink">Which number is it?</p>
                  <div ref={optionsRef} className="grid grid-cols-2 gap-2" role="group" aria-labelledby="q-label">
                    {question.options.map((o) => (
                      <button
                        key={o}
                        type="button"
                        disabled={locked}
                        onClick={() => submit(o)}
                        className="min-h-20 rounded-button border-2 border-b-4 border-hairline bg-card px-3 py-2 font-display text-[clamp(18px,4vw,26px)] font-black text-ink tabular-nums hover:border-primary"
                      >
                        {num(o)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {question.kind === "recall" && (
                <form
                  className="mt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!locked && typed.trim()) submit(typed);
                  }}
                >
                  <label htmlFor="recall-answer" className="mb-2 block font-bold text-ink">
                    Type the reading
                  </label>
                  <div className="flex gap-3 max-sm:flex-col">
                    <input
                      ref={inputRef}
                      id="recall-answer"
                      type="text"
                      lang="en"
                      value={typed}
                      readOnly={locked}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="e.g. sanbyakuman"
                      className="min-h-13 min-w-0 flex-1 rounded-button border-2 border-hairline bg-card px-4 text-[20px] text-ink placeholder:text-muted/60 focus:border-primary"
                    />
                    <button type="submit" className="btn btn-primary min-w-32" disabled={locked || !typed.trim()}>
                      Check
                    </button>
                  </div>
                  <p className="mt-2 text-[14px] text-muted">
                    Spaces and long vowels don&apos;t matter — kyū, kyuu and kyu all count.
                  </p>
                </form>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {question.kind === "build" && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={locked || picked.length === 0}
                    onClick={() => {
                      setPicked([]);
                      focusOptions();
                    }}
                  >
                    Start over
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => submit(question.kind === "build" ? [] : null)}
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
              givenLabel={question.kind === "recall" ? "you typed" : "you chose"}
              kana={answer.kana}
              notes={last.notes}
              answer={
                <>
                  <span lang="ja" className="jp mr-2 inline-block align-middle text-jp whitespace-nowrap">
                    {answer.kanji}
                  </span>
                  <span className="align-middle">{answer.reading}</span>
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
          accuracy={accuracy}
          longestStreak={round.longestStreak}
          xpEarned={round.score}
          leveledUp={summary.leveledUp}
          level={summary.level}
          missed={missed}
          playAgainLabel={`${MODES[mode].name} again`}
          backLabel="All three"
          note={<GradeCard modeName={MODES[mode].name} accuracy={accuracy} correct={correctCount} total={round.results.length} />}
          onPlayAgain={() => start(mode)}
          onBack={() => setPhase("picking")}
        />
      )}
    </section>
  );
}

/** Build it: pick the kanji for each place, four at a time. */
function BuildBody({
  question, picked, step, locked, optionsRef, onPick, onRewind,
}: {
  question: Extract<Question, { kind: "build" }>;
  picked: Item[];
  step: { answer: Item; options: Item[] } | undefined;
  locked: boolean;
  optionsRef: React.RefObject<HTMLDivElement | null>;
  onPick: (o: Item) => void;
  onRewind: (i: number) => void;
}) {
  const stepIndex = picked.length;
  return (
    <>
      <p id="chooser-label" className="mt-5 mb-2 font-bold text-ink">
        {locked
          ? "Your answer"
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
            onClick={() => onRewind(i)}
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
            onClick={() => onPick(o)}
            className="flex min-h-24 flex-col items-center justify-center rounded-button border-2 border-b-4 border-hairline bg-card px-2 py-2 hover:border-primary"
          >
            <span lang="ja" className="jp text-jp leading-tight text-ink">{o.jp}</span>
            <span className="mt-1 text-[15px] leading-tight font-bold text-muted">{o.readings.join(" / ")}</span>
          </button>
        ))}
      </div>
    </>
  );
}
