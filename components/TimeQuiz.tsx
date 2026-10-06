"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gradeFor } from "@/lib/modes";
import { isoDate, recordGrade, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import { timeKana, type ClockTime } from "@/lib/time";
import {
  buildTimeRound, checkTimeAnswer, TIME_MODE_IDS, TIME_MODES, type TimeModeId, type TimeQuestion,
} from "@/lib/timequiz";
import type { ReviewItem } from "@/lib/types";
import { ClockSet } from "./ClockSet";
import { DifficultyBadge, GradeCard } from "./GradeCard";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: TimeQuestion[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: boolean[];
};

const NEW_ROUND = (queue: TimeQuestion[]): Round => ({
  queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [],
});

const CLOCK_START: ClockTime = { hour: 12, minute: 0 };

const reviewItem = (q: TimeQuestion, note: string): ReviewItem => ({
  id: q.id,
  jp: q.kanji,
  readings: [`${q.digital} · ${q.reading}`],
  note,
});

export function TimeQuiz() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<TimeModeId>("time-read");
  const [periods, setPeriods] = useState(false);
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [clock, setClock] = useState<ClockTime>(CLOCK_START);
  const [typed, setTyped] = useState("");
  const [last, setLast] = useState<{ score: AnswerScore; note: string; given: string } | null>(null);
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
  const locked = phase !== "question";

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    if (mode === "time-say") inputRef.current?.focus({ preventScroll: true });
    else if (mode === "time-read" && document.activeElement === document.body) {
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    }
    return () => window.clearInterval(id);
  }, [phase, round.index, mode]);

  const start = (m: TimeModeId = mode) => {
    setMode(m);
    requeues.current = new Map();
    setRound(NEW_ROUND(buildTimeRound(m, { periods, length: ROUND_LENGTH })));
    setClock(CLOCK_START);
    setTyped("");
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  };

  /** The answer is passed in, since picking an option submits before state settles. */
  const submit = useCallback(
    (given: string | ClockTime | null) => {
      if (phase !== "question" || !question) return;
      const correct = checkTimeAnswer(question, mode, given);
      const shown =
        given === null ? "" : typeof given === "string" ? given.trim() : `${given.hour}:${String(given.minute).padStart(2, "0")}`;
      const note = correct
        ? ""
        : `${question.kanji} is ${question.digital} — ${question.reading}.`;

      const ms = performance.now() - shownAt.current;
      const score = scoreAnswer({ correct, ms, streak: round.streak });

      setRound((r) => ({
        ...r,
        queue: correct ? r.queue : requeueMissed(r.queue, r.index, { counts: requeues.current, key: (x) => x.id }),
        streak: score.streak,
        longestStreak: Math.max(r.longestStreak, score.streak),
        score: r.score + score.points,
        results: [...r.results, correct],
      }));
      if (!correct) {
        setMissed((m) => (m.some((i) => i.id === question.id) ? m : [...m, reviewItem(question, note)]));
        setMissCount((c) => c + 1);
      }
      setLast({ score, note, given: shown });
      setAnswerCount((c) => c + 1);
      setAnnouncement(
        correct
          ? `Correct. ${question.kanji}, ${question.reading}. Plus ${score.points} points.`
          : `Not quite. ${question.kanji} is ${question.digital}, ${question.reading}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, question, mode, round.streak],
  );

  const next = () => {
    setClock(CLOCK_START);
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

  return (
    <section aria-label="Telling time quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Pick how you want to practise</h2>
          <p className="mt-1 text-ink/80">
            All three are open — take them in any order. Each round is {ROUND_LENGTH} times and ends with a grade.
            Every answer is read aloud when it appears, so you hear the reading as well as see it.
          </p>

          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {TIME_MODE_IDS.map((id) => {
              const m = TIME_MODES[id];
              const best = progress.grades[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    aria-describedby={`tmode-${id}-blurb`}
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
                    <span id={`tmode-${id}-blurb`} className="mt-1 text-[15px] leading-normal text-muted">
                      {m.blurb}
                    </span>
                    <span lang="ja" className="jp mt-3 text-[17px] text-ink">{m.sample}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <fieldset className="mt-6">
            <legend className="mb-3 font-bold text-ink">Extra for “Read it” and “Say it”</legend>
            <button
              type="button"
              aria-pressed={periods}
              onClick={() => setPeriods((v) => !v)}
              className={`min-h-11 rounded-full border-2 px-5 py-1.5 text-[15px] font-bold ${
                periods ? "border-primary bg-primary text-card" : "border-hairline bg-card text-primary hover:border-primary"
              }`}
            >
              <span aria-hidden="true" className="mr-1.5 inline-block w-3">{periods ? "✓" : ""}</span>
              Include 午前 / 午後 (a.m. and p.m.)
            </button>
            <p className="mt-2 text-[14px] text-muted">A clock face shows neither, so “Set it” never asks for them.</p>
          </fieldset>
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
          <p className="mt-2 text-[14px] font-bold text-muted">
            {TIME_MODES[mode].name} — {TIME_MODES[mode].task}
          </p>

          <div className="mt-4 flex gap-6 max-sm:flex-col">
            <div className="flex shrink-0 justify-center sm:block">
              <Sennin key={answerCount} state={senninState} size={120} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-36 items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
                <span lang="ja" className="jp text-center text-[clamp(36px,10vw,64px)] leading-tight text-ink">
                  {question.kanji}
                </span>
              </div>

              {mode === "time-read" && (
                <>
                  <p id="t-label" className="mt-5 mb-2 font-bold text-ink">Which time is it?</p>
                  <div ref={optionsRef} className="grid grid-cols-2 gap-2" role="group" aria-labelledby="t-label">
                    {question.options?.map((o) => (
                      <button
                        key={o}
                        type="button"
                        disabled={locked}
                        onClick={() => submit(o)}
                        className="min-h-20 rounded-button border-2 border-b-4 border-hairline bg-card px-3 py-2 font-display text-[clamp(18px,4vw,26px)] font-black text-ink tabular-nums hover:border-primary"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === "time-set" && (
                <div className="mt-5">
                  <p className="mb-3 font-bold text-ink">Drag the hands to match</p>
                  <div className="flex flex-col items-center gap-4">
                    <ClockSet value={clock} onChange={setClock} disabled={locked} />
                    <button
                      type="button"
                      className="btn btn-primary min-w-32"
                      disabled={locked}
                      onClick={() => submit(clock)}
                    >
                      Check
                    </button>
                  </div>
                  <p className="mt-3 text-[14px] text-muted">
                    Press anywhere on the dial to move the nearest hand, or tab to a hand and use the arrow keys.
                  </p>
                </div>
              )}

              {mode === "time-say" && (
                <form
                  className="mt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!locked && typed.trim()) submit(typed);
                  }}
                >
                  <label htmlFor="time-answer" className="mb-2 block font-bold text-ink">Type the reading</label>
                  <div className="flex gap-3 max-sm:flex-col">
                    <input
                      ref={inputRef}
                      id="time-answer"
                      type="text"
                      lang="en"
                      value={typed}
                      readOnly={locked}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="e.g. yoji han"
                      className="min-h-13 min-w-0 flex-1 rounded-button border-2 border-hairline bg-card px-4 text-[20px] text-ink placeholder:text-muted/60 focus:border-primary"
                    />
                    <button type="submit" className="btn btn-primary min-w-32" disabled={locked || !typed.trim()}>
                      Check
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => submit(null)}
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
              item={reviewItem(question, last.note)}
              score={last.score}
              given={last.given}
              givenLabel={mode === "time-say" ? "you typed" : mode === "time-set" ? "you set" : "you chose"}
              kana={timeKana(question.time)}
              notes={last.note ? [last.note] : []}
              /* 四時 is yoji and 九時 is kuji; only the kana guarantees the voice says so. */
              speak={timeKana(question.time)}
              speakLabel={`the time, ${question.reading}`}
              answer={
                <>
                  <span className="mr-2 align-middle font-bold tabular-nums">{question.digital}</span>
                  <span className="align-middle">{question.reading}</span>
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
          playAgainLabel={`${TIME_MODES[mode].name} again`}
          backLabel="All three"
          note={
            <GradeCard
              modeName={TIME_MODES[mode].name}
              accuracy={accuracy}
              correct={correctCount}
              total={round.results.length}
            />
          }
          onPlayAgain={() => start(mode)}
          onBack={() => setPhase("picking")}
        />
      )}
    </section>
  );
}
