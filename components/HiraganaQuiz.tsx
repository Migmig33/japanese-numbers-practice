"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildKanaRound, checkKanaAnswer, HIRAGANA_MODE_IDS, HIRAGANA_MODES, kanaPool,
  type HiraganaModeId, type KanaQuestion, type KanaSet,
} from "@/lib/hiragana";
import { gradeFor } from "@/lib/modes";
import { isoDate, recordGrade, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import type { ReviewItem } from "@/lib/types";
import { DifficultyBadge, GradeCard } from "./GradeCard";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: KanaQuestion[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: boolean[];
};

const NEW_ROUND = (queue: KanaQuestion[]): Round => ({
  queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [],
});

const SETS: { id: KanaSet; label: string; hint: string }[] = [
  { id: "basic", label: "The 46 basic", hint: "あ to ん" },
  { id: "dakuten", label: "With ゛and ゜", hint: "が, ざ, ぱ…" },
  { id: "combo", label: "Combinations", hint: "きゃ, しゅ, ちょ…" },
];

const reviewItem = (q: KanaQuestion): ReviewItem => ({
  id: q.id,
  jp: q.item.kana,
  readings: [q.item.romaji],
  note: q.item.note ?? "",
});

export function HiraganaQuiz() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<HiraganaModeId>("kana-read");
  const [sets, setSets] = useState<KanaSet[]>(["basic"]);
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [typed, setTyped] = useState("");
  const [last, setLast] = useState<{ score: AnswerScore; given: string } | null>(null);
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
  const poolSize = kanaPool(sets).length;

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    if (mode === "kana-type") inputRef.current?.focus({ preventScroll: true });
    else if (document.activeElement === document.body) {
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    }
    return () => window.clearInterval(id);
  }, [phase, round.index, mode]);

  const start = (m: HiraganaModeId = mode) => {
    setMode(m);
    requeues.current = new Map();
    setRound(NEW_ROUND(buildKanaRound(m, { sets, length: ROUND_LENGTH })));
    setTyped("");
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  };

  const toggleSet = (id: KanaSet) =>
    setSets((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      // Never leave the learner with nothing to practise.
      return next.length ? next : s;
    });

  const submit = useCallback(
    (given: string | null) => {
      if (phase !== "question" || !question) return;
      const correct = checkKanaAnswer(question, mode, given);
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
        setMissed((m) => (m.some((i) => i.id === question.id) ? m : [...m, reviewItem(question)]));
        setMissCount((c) => c + 1);
      }
      setLast({ score, given: given?.trim() ?? "" });
      setAnswerCount((c) => c + 1);
      setAnnouncement(
        correct
          ? `Correct. ${question.item.kana} is ${question.item.romaji}. Plus ${score.points} points.`
          : `Not quite. ${question.item.kana} is ${question.item.romaji}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, question, mode, round.streak],
  );

  const next = () => {
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
    <section aria-label="Hiragana quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Pick how you want to practise</h2>
          <p className="mt-1 text-ink/80">
            All three are open — take them in any order. Each round is {ROUND_LENGTH} characters and ends with a grade.
            Every answer is read aloud when it appears, so you hear the sound as well as see the character.
          </p>

          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {HIRAGANA_MODE_IDS.map((id) => {
              const m = HIRAGANA_MODES[id];
              const best = progress.grades[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    aria-describedby={`kmode-${id}-blurb`}
                    className="flex h-full w-full flex-col rounded-card border-2 border-hairline bg-card p-5 text-left transition-colors hover:border-primary"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[19px] font-black text-ink">{m.name}</span>
                      <DifficultyBadge level={m.difficulty} />
                      {best !== undefined && (
                        <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-display text-[14px] font-black text-on-solid">
                          Best {gradeFor(best).letter}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 font-bold text-primary">{m.task}</span>
                    <span id={`kmode-${id}-blurb`} className="mt-1 text-[15px] leading-normal text-muted">{m.blurb}</span>
                    <span lang="ja" className="jp mt-3 text-[17px] text-ink">{m.sample}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <fieldset className="mt-6">
            <legend className="mb-3 font-bold text-ink">Which characters</legend>
            <div className="flex flex-wrap gap-2">
              {SETS.map((s) => {
                const on = sets.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSet(s.id)}
                    className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-[15px] font-bold ${
                      on ? "border-primary bg-primary text-on-solid" : "border-hairline bg-card text-primary hover:border-primary"
                    }`}
                  >
                    <span aria-hidden="true" className="mr-1.5 inline-block w-3">{on ? "✓" : ""}</span>
                    {s.label} <span lang="ja" className="jp font-normal opacity-80">{s.hint}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[14px] text-muted tabular-nums">{poolSize} characters in the pool.</p>
          </fieldset>
        </div>
      )}

      {(phase === "question" || phase === "correct" || phase === "wrong") && question && (
        <div className="min-h-[560px] p-5 pb-8 sm:p-8">
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
            {HIRAGANA_MODES[mode].name} — {HIRAGANA_MODES[mode].task}
          </p>

          <div className="mt-4 flex gap-6 max-sm:flex-col">
            <div className="flex shrink-0 justify-center sm:block">
              <Sennin key={answerCount} state={senninState} size={120} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-40 items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
                {mode === "kana-find" ? (
                  <span className="font-display text-[clamp(44px,12vw,80px)] leading-none font-black text-ink">
                    {question.item.romaji}
                  </span>
                ) : (
                  <span lang="ja" className="jp text-[clamp(64px,18vw,112px)] leading-none text-ink">
                    {question.item.kana}
                  </span>
                )}
              </div>

              {mode === "kana-type" ? (
                <form
                  className="mt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!locked && typed.trim()) submit(typed);
                  }}
                >
                  <label htmlFor="kana-answer" className="mb-2 block font-bold text-ink">Type the sound</label>
                  <div className="flex gap-3 max-sm:flex-col">
                    <input
                      ref={inputRef}
                      id="kana-answer"
                      type="text"
                      lang="en"
                      value={typed}
                      readOnly={locked}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="e.g. shi"
                      className="min-h-13 min-w-0 flex-1 rounded-button border-2 border-hairline bg-card px-4 text-[20px] text-ink placeholder:text-muted/60 focus:border-primary"
                    />
                    <button type="submit" className="btn btn-primary min-w-32" disabled={locked || !typed.trim()}>
                      Check
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p id="k-label" className="mt-5 mb-2 font-bold text-ink">
                    {mode === "kana-find" ? "Which character makes it?" : "Which sound does it make?"}
                  </p>
                  <div ref={optionsRef} className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-labelledby="k-label">
                    {question.options?.map((o) => (
                      <button
                        key={o}
                        type="button"
                        lang={mode === "kana-find" ? "ja" : "en"}
                        disabled={locked}
                        onClick={() => submit(o)}
                        className={`min-h-20 rounded-button border-2 border-b-4 border-hairline bg-card px-3 py-2 text-ink hover:border-primary ${
                          mode === "kana-find" ? "jp text-[34px]" : "font-display text-[24px] font-black"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </>
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
              item={reviewItem(question)}
              score={last.score}
              given={last.given}
              givenLabel={mode === "kana-type" ? "you typed" : "you chose"}
              notes={phase === "wrong" && question.item.note ? [question.item.note] : []}
              speak={question.item.kana}
              speakLabel={`the character, ${question.item.romaji}`}
              answer={
                <>
                  <span lang="ja" className="jp mr-2 inline-block align-middle text-[34px]">{question.item.kana}</span>
                  <span className="align-middle">{question.item.romaji}</span>
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
          playAgainLabel={`${HIRAGANA_MODES[mode].name} again`}
          backLabel="All three"
          note={
            <GradeCard
              modeName={HIRAGANA_MODES[mode].name}
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
