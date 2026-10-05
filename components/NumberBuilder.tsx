"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildNotes, buildNumbers, buildTiles, checkBuild, chunksFor, kanjiFor, readingFor, type Tile,
} from "@/lib/compose";
import { isoDate, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import type { ReviewItem } from "@/lib/types";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: number[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: { n: number; correct: boolean }[];
};

const RANGES = [99, 999, 9999] as const;
type Range = (typeof RANGES)[number];

const NEW_ROUND = (queue: number[]): Round => ({ queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [] });

const reviewItem = (n: number, notes: string[]): ReviewItem => ({
  id: `build-${n}`,
  jp: kanjiFor(n),
  readings: [`${n.toLocaleString("en")} · ${readingFor(n)}`],
  note: notes.join(" "),
});

/**
 * "Build the number": the question is a number in digits; the learner taps tiles in
 * order to write it in kanji (百 二) or to say it in romaji (hyaku ni).
 */
export function NumberBuilder() {
  const { progress } = useProgress();
  const [range, setRange] = useState<Range>(999);
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [picked, setPicked] = useState<Tile[]>([]);
  const [last, setLast] = useState<{ score: AnswerScore; given: string; notes: string[] } | null>(null);
  const [missed, setMissed] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<{ leveledUp: boolean; level: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [answerCount, setAnswerCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const shownAt = useRef(0);
  const requeues = useRef(new Map<string, number>());
  const poolRef = useRef<HTMLDivElement>(null);

  const n = round.queue[round.index];

  const focusFirstTile = () =>
    requestAnimationFrame(() =>
      poolRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }),
    );

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    focusFirstTile();
    return () => window.clearInterval(id);
  }, [phase, round.index, round.queue]);

  const ask = (queue: number[], index: number) => {
    setTiles(buildTiles(queue[index]!));
    setPicked([]);
    setPhase("question");
  };

  const start = () => {
    const queue = buildNumbers(ROUND_LENGTH, range);
    requeues.current = new Map();
    setRound(NEW_ROUND(queue));
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    ask(queue, 0);
  };

  const submit = useCallback(
    (skip: boolean) => {
      if (phase !== "question" || n === undefined) return;
      const labels = picked.map((t) => t.label);
      const correct = !skip && checkBuild(n, labels);
      const ms = performance.now() - shownAt.current;
      // Speed bonus per tile, so long numbers aren't penalised for having more pieces.
      const score = scoreAnswer({ correct, ms: ms / chunksFor(n).length, streak: round.streak });
      const notes = buildNotes(n, labels);

      setRound((r) => ({
        ...r,
        queue: correct ? r.queue : requeueMissed(r.queue, r.index, { counts: requeues.current, key: String }),
        streak: score.streak,
        longestStreak: Math.max(r.longestStreak, score.streak),
        score: r.score + score.points,
        results: [...r.results, { n, correct }],
      }));
      if (!correct) setMissed((m) => (m.some((i) => i.id === `build-${n}`) ? m : [...m, reviewItem(n, notes)]));
      setLast({ score, given: skip ? "" : labels.join(""), notes });
      setAnswerCount((c) => c + 1);
      if (!correct) setMissCount((c) => c + 1);
      setAnnouncement(
        correct
          ? `Correct. ${kanjiFor(n)}, ${readingFor(n)}. Plus ${score.points} points.`
          : `Not quite. ${n} is ${kanjiFor(n)}, ${readingFor(n)}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, n, picked, round.streak],
  );

  const next = () => {
    if (round.index + 1 < round.queue.length) {
      setRound((r) => ({ ...r, index: r.index + 1 }));
      ask(round.queue, round.index + 1);
      return;
    }
    const before = progress.level;
    const after = levelForXp(progress.xp + round.score);
    updateProgress((p) => recordRound(p, { score: round.score, date: isoDate() }));
    setSummary({ leveledUp: after > before, level: after });
    setAnnouncement(`Round complete. Score ${round.score}.`);
    setPhase("summary");
  };

  const pick = (tile: Tile) => {
    setPicked((p) => [...p, tile]);
    focusFirstTile();
  };
  const unpick = (key: string) => setPicked((p) => p.filter((t) => t.key !== key));

  const usedKeys = new Set(picked.map((t) => t.key));
  const multiplier = nextMultiplier(round.streak);
  const senninState: SenninState =
    phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : round.streak >= 3 ? "streak" : "idle";
  const locked = phase !== "question";
  const correctCount = round.results.filter((r) => r.correct).length;
  const tileText = "jp text-jp";

  return (
    <section aria-label="Build the number quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Spell the number</h2>
          <p className="mt-1 text-ink/80">
            You&apos;ll see a number in digits. Tap the characters in order to write it out — 102 is{" "}
            <span lang="ja" className="jp text-[22px] text-ink">百二</span>, with nothing for the zero and no 一 in
            front. Twelve numbers a round.
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

          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-accent min-w-44 text-[18px]" onClick={start}>
              Start
            </button>
          </div>
        </div>
      )}

      {(phase === "question" || phase === "correct" || phase === "wrong") && n !== undefined && (
        <div className="min-h-[600px] p-5 pb-8 sm:p-8">
          <QuizHud
            total={round.queue.length}
            index={round.index}
            answered={phase !== "question"}
            results={round.results.map((r) => r.correct)}
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
              <div className="flex min-h-40 items-center justify-center rounded-card border border-hairline bg-paper px-4 py-6">
                <span className="font-display text-[clamp(56px,18vw,88px)] leading-tight font-black text-ink tabular-nums sm:text-jp-test">
                  {n.toLocaleString("en")}
                </span>
              </div>

              <p id="build-label" className="mt-5 mb-2 font-bold text-ink">
                Write it in kanji — tap the characters in order
              </p>
              <div
                aria-labelledby="build-label"
                role="group"
                className="flex min-h-[76px] flex-wrap items-center gap-2 rounded-button border-2 border-dashed border-hairline bg-paper/60 p-2"
              >
                {picked.length === 0 && <span className="px-2 text-[15px] text-muted">Your answer appears here.</span>}
                {picked.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    lang="ja"
                    disabled={locked}
                    onClick={() => unpick(t.key)}
                    aria-label={`Remove ${t.label}, position ${i + 1}`}
                    className={`min-h-14 min-w-14 rounded-button border-2 border-primary bg-card px-3 text-primary ${tileText}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div ref={poolRef} className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tiles">
                {tiles.map((t) => {
                  const used = usedKeys.has(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      lang="ja"
                      disabled={locked || used}
                      aria-hidden={used || undefined}
                      onClick={() => pick(t)}
                      className={`min-h-14 min-w-14 rounded-button border-2 border-b-4 border-hairline bg-card px-3 text-ink hover:border-primary ${tileText} ${
                        used ? "invisible" : ""
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-primary min-w-32" disabled={locked || picked.length === 0} onClick={() => submit(false)}>
                  Check
                </button>
                <button type="button" className="btn btn-ghost" disabled={locked || picked.length === 0} onClick={() => setPicked([])}>
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
              item={reviewItem(n, last.notes)}
              score={last.score}
              given={last.given}
              givenLabel="you built"
              notes={last.notes}
              answer={
                <>
                  <span lang="ja" className="jp mr-2 inline-block align-middle text-jp whitespace-nowrap">{kanjiFor(n)}</span>
                  <span className="align-middle">{readingFor(n)}</span>
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
