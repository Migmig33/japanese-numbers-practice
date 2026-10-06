"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gradeFor } from "@/lib/modes";
import {
  answerOf, buildParticleRound, checkParticleAnswer, gappedSentence, PARTICLE_MODE_IDS, PARTICLE_MODES,
  readingsOf, sentenceOf, type ParticleModeId, type ParticleQuestion,
} from "@/lib/particles";
import { isoDate, recordGrade, recordRound, updateProgress, useProgress } from "@/lib/progress";
import { levelForXp, nextMultiplier, scoreAnswer, type AnswerScore } from "@/lib/scoring";
import { requeueMissed, ROUND_LENGTH } from "@/lib/srs";
import type { ReviewItem } from "@/lib/types";
import { DifficultyBadge, GradeCard } from "./GradeCard";
import { QuizHud } from "./QuizHud";
import { Reading } from "./Reading";
import { ResultBar } from "./ResultBar";
import { Sennin, type SenninState } from "./Sennin";
import { SummaryCard } from "./SummaryCard";

type Phase = "picking" | "question" | "correct" | "wrong" | "summary";

type Round = {
  queue: ParticleQuestion[];
  index: number;
  streak: number;
  longestStreak: number;
  score: number;
  results: boolean[];
};

const NEW_ROUND = (queue: ParticleQuestion[]): Round => ({
  queue, index: 0, streak: 0, longestStreak: 0, score: 0, results: [],
});

const reviewItem = (q: ParticleQuestion): ReviewItem => ({
  id: q.id,
  jp: sentenceOf(q.item),
  readings: [`${q.item.romaji} — ${q.item.english}`],
  note: q.item.note,
});

export function ParticleQuiz() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<ParticleModeId>("particle-pick");
  const [phase, setPhase] = useState<Phase>("picking");
  const [round, setRound] = useState<Round>(() => NEW_ROUND([]));
  const [built, setBuilt] = useState<number[]>([]);
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

  const question = round.queue[round.index];
  const locked = phase !== "question";

  useEffect(() => {
    if (phase !== "question") return;
    shownAt.current = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    if (document.activeElement === document.body) {
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    }
    return () => window.clearInterval(id);
  }, [phase, round.index]);

  const focusOptions = () =>
    requestAnimationFrame(() =>
      optionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }),
    );

  const start = (m: ParticleModeId = mode) => {
    setMode(m);
    requeues.current = new Map();
    setRound(NEW_ROUND(buildParticleRound(m, { length: ROUND_LENGTH })));
    setBuilt([]);
    setMissed([]);
    setLast(null);
    setSummary(null);
    setAnnouncement("");
    setPhase("question");
  };

  /** The answer comes in as an argument: the last tap submits before state settles. */
  const submit = useCallback(
    (given: string | string[] | null) => {
      if (phase !== "question" || !question) return;
      const correct = checkParticleAnswer(question, mode, given);
      const shown = given === null ? "" : Array.isArray(given) ? given.join("") : given;

      const ms = performance.now() - shownAt.current;
      const score = scoreAnswer({ correct, ms: ms / (mode === "particle-order" ? question.item.chunks.length : 1), streak: round.streak });

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
      setLast({ score, given: shown });
      setAnswerCount((c) => c + 1);
      setAnnouncement(
        correct
          ? `Correct. ${question.item.romaji}. Plus ${score.points} points.`
          : `Not quite. ${sentenceOf(question.item)} — ${question.item.romaji}.`,
      );
      setPhase(correct ? "correct" : "wrong");
    },
    [phase, question, mode, round.streak],
  );

  const next = () => {
    setBuilt([]);
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
    <section aria-label="Japanese particles quiz" className="relative overflow-hidden rounded-card border border-hairline bg-card">
      <p aria-live="polite" role="status" className="sr-only">{announcement}</p>

      {phase === "picking" && (
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-[26px] text-primary">Pick how you want to practise</h2>
          <p className="mt-1 text-ink/80">
            Both are open — take them in any order. Each round is {ROUND_LENGTH} sentences and ends with a grade.
            Each answer is read aloud when it appears, so you hear the sentence as well as read it.
          </p>

          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {PARTICLE_MODE_IDS.map((id) => {
              const m = PARTICLE_MODES[id];
              const best = progress.grades[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    aria-describedby={`pmode-${id}-blurb`}
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
                    <span id={`pmode-${id}-blurb`} className="mt-1 text-[15px] leading-normal text-muted">{m.blurb}</span>
                    <span lang="ja" className="jp mt-3 text-[17px] text-ink">{m.sample}</span>
                  </button>
                </li>
              );
            })}
          </ul>
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
            {PARTICLE_MODES[mode].name} — {PARTICLE_MODES[mode].task}
          </p>

          <div className="mt-4 flex gap-6 max-sm:flex-col">
            <div className="flex shrink-0 justify-center sm:block">
              <Sennin key={answerCount} state={senninState} size={120} />
            </div>
            <div className="min-w-0 flex-1">
              {mode === "particle-pick" ? (
                <>
                  <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-card border border-hairline bg-paper px-4 py-6">
                    <span lang="ja" className="jp text-center text-[clamp(26px,6vw,40px)] leading-snug text-ink">
                      {gappedSentence(question.item)}
                    </span>
                    <span className="text-center text-[15px] text-muted">{question.item.english}</span>
                  </div>
                  <p id="p-label" className="mt-5 mb-2 font-bold text-ink">Which particle fits?</p>
                  <div ref={optionsRef} className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-labelledby="p-label">
                    {question.options?.map((o) => (
                      <button
                        key={o}
                        type="button"
                        lang="ja"
                        disabled={locked}
                        onClick={() => submit(o)}
                        className="jp min-h-20 rounded-button border-2 border-b-4 border-hairline bg-card px-3 py-2 text-jp text-ink hover:border-primary"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex min-h-28 items-center justify-center rounded-card border border-hairline bg-paper px-4 py-5">
                    <span className="text-center text-[clamp(18px,4vw,24px)] font-bold text-ink">
                      {question.item.english}
                    </span>
                  </div>

                  <p id="p-label" className="mt-5 mb-2 font-bold text-ink">
                    {built.length === question.item.chunks.length
                      ? "Your sentence"
                      : `Tap the pieces in order — ${built.length + 1} of ${question.item.chunks.length}`}
                  </p>
                  <div
                    aria-labelledby="p-label"
                    role="group"
                    className="flex min-h-[72px] flex-wrap items-center gap-2 rounded-button border-2 border-dashed border-hairline bg-paper/60 p-2"
                  >
                    {built.length === 0 && <span className="px-2 text-[15px] text-muted">Your sentence appears here.</span>}
                    {built.map((tileIndex, i) => (
                      <button
                        key={`${tileIndex}-${i}`}
                        type="button"
                        lang="ja"
                        disabled={locked}
                        onClick={() => {
                          setBuilt((b) => b.slice(0, i));
                          focusOptions();
                        }}
                        aria-label={`Remove ${question.tiles?.[tileIndex]}, position ${i + 1}`}
                        className="jp min-h-12 rounded-button border-2 border-primary bg-card px-3 py-1 text-[22px] text-primary"
                      >
                        {question.tiles?.[tileIndex]}
                      </button>
                    ))}
                  </div>

                  <div ref={optionsRef} className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Pieces">
                    {question.tiles?.map((tile, i) => {
                      const used = built.includes(i);
                      return (
                        <button
                          key={`${tile}-${i}`}
                          type="button"
                          lang="ja"
                          disabled={locked || used}
                          aria-hidden={used || undefined}
                          onClick={() => {
                            const chosen = [...built, i];
                            setBuilt(chosen);
                            if (chosen.length === question.item.chunks.length) {
                              submit(chosen.map((k) => question.tiles![k]!));
                            } else focusOptions();
                          }}
                          className={`jp min-h-14 rounded-button border-2 border-b-4 border-hairline bg-card px-4 py-1 text-[22px] text-ink hover:border-primary ${
                            used ? "invisible" : ""
                          }`}
                        >
                          {tile}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {mode === "particle-order" && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={locked || built.length === 0}
                    onClick={() => {
                      setBuilt([]);
                      focusOptions();
                    }}
                  >
                    Start over
                  </button>
                )}
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
              givenLabel={mode === "particle-order" ? "you built" : "you chose"}
              notes={phase === "wrong" ? [question.item.note] : []}
              /*
               * Both only ever appear once the answer is in. Reading the sentence aloud,
               * or printing it word by word, would hand over the particle being tested —
               * and in "put it in order", the order too.
               */
              speak={sentenceOf(question.item)}
              speakLabel={`the sentence, ${question.item.english}`}
              answer={
                <Reading
                  chunks={question.item.chunks}
                  readings={readingsOf(question.item)}
                  highlight={question.item.blank}
                  size="text-[26px]"
                />
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
          playAgainLabel={`${PARTICLE_MODES[mode].name} again`}
          backLabel="Both ways"
          note={
            <GradeCard
              modeName={PARTICLE_MODES[mode].name}
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
