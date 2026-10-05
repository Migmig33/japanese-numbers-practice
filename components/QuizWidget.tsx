"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { itemsInSets } from "@/lib/items";
import { matchesReading } from "@/lib/normalize";
import { isoDate, recordAnswer, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { buildRound, requeueMissed } from "@/lib/srs";
import type { Item, SetId } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";
import { QuizHud } from "./QuizHud";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SetPicker } from "./SetPicker";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Result = { item: Item; correct: boolean; points: number };

type Round = {
  queue: Item[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: Result[];
};

const NEW_ROUND = (queue: Item[]): Round => ({ queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [] });

export function QuizWidget({ defaultSets, label }: { defaultSets: SetId[]; label: string }) {
  const { progress } = useProgress();
  const [selected, setSelected] = useState<ReadonlySet<SetId>>(() => new Set(defaultSets));
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [answer, setAnswer] = useState("");
  const [last, setLast] = useState<{ score: AnswerScore; given: string } | null>(null);
  const [summary, setSummary] = useState<{ leveledUp: boolean; level: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [answerCount, setAnswerCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const shownAt = useRef(0);
  const requeues = useRef(new Map<string, number>());
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(() => itemsInSets(selected), [selected]);
  const item = round.queue[round.index];

  // Per-question timer.
  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    inputRef.current?.focus({ preventScroll: true });
    return () => window.clearInterval(id);
  }, [phase, round.index, round.queue]);

  const start = useCallback(() => {
    if (pool.length === 0) return;
    requeues.current = new Map();
    setRound(NEW_ROUND(buildRound(pool)));
    setAnswer("");
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  }, [pool]);

  const submit = useCallback(
    (given: string) => {
      if (phase !== "question" || !item) return;
      const ms = performance.now() - shownAt.current;
      const correct = given.trim() !== "" && matchesReading(given, item.readings);
      const score = scoreAnswer({ correct, ms, streak: round.streak });

      updateProgress((p) => recordAnswer(p, item.id, correct));
      setRound((r) => ({
        ...r,
        queue: correct ? r.queue : requeueMissed(r.queue, r.index, { counts: requeues.current, key: (x) => x.id }),
        streak: score.streak,
        longestStreak: Math.max(r.longestStreak, score.streak),
        score: r.score + score.points,
        results: [...r.results, { item, correct, points: score.points }],
      }));
      setLast({ score, given });
      setAnswerCount((n) => n + 1);
      if (!correct) setMissCount((n) => n + 1);
      setAnnouncement(
        correct
          ? `Correct. ${item.readings[0]}. Plus ${score.points} points.`
          : `Not quite. The answer is ${item.readings.join(" or ")}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, item, round.streak],
  );

  const next = useCallback(() => {
    if (round.index + 1 < round.queue.length) {
      setRound((r) => ({ ...r, index: r.index + 1 }));
      setAnswer("");
      setPhase("question");
      return;
    }
    const before = progress.level;
    const after = levelForXp(progress.xp + round.score);
    updateProgress((p) => recordRound(p, { score: round.score, date: isoDate() }));
    setSummary({ leveledUp: after > before, level: after });
    setAnnouncement(`Round complete. Score ${round.score}.`);
    setPhase("summary");
  }, [round, progress.level, progress.xp]);

  const toggle = (id: SetId) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const multiplier = nextMultiplier(round.streak);
  const senninState: SenninState =
    phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : round.streak >= 3 ? "streak" : "idle";

  const missed = useMemo(() => {
    const seen = new Map<string, Item>();
    for (const r of round.results) if (!r.correct) seen.set(r.item.id, r.item);
    return [...seen.values()];
  }, [round.results]);

  const correctCount = round.results.filter((r) => r.correct).length;

  return (
    <section aria-label={label} className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <SetPicker
          selected={selected}
          count={pool.length}
          onToggle={toggle}
          onClear={() => setSelected(new Set())}
          onStart={start}
        />
      )}

      {(phase === "question" || phase === "correct" || phase === "wrong") && item && (
        <div className="min-h-[520px] p-5 pb-8 sm:p-8">
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
              <QuestionCard
                ref={inputRef}
                item={item}
                value={phase === "question" ? answer : (last?.given ?? answer)}
                locked={phase !== "question"}
                onChange={setAnswer}
                onCheck={() => submit(answer)}
                onSkip={() => submit("")}
              />
            </div>
          </div>

          {(phase === "correct" || phase === "wrong") && last && (
            <ResultBar kind={phase} item={item} score={last.score} given={last.given} onContinue={next} />
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
