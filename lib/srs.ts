import type { Progress } from "./progress";
import type { Item } from "./types";

export const ROUND_LENGTH = 12;
/** A missed item comes back this many questions later. */
export const REQUEUE_GAP = 2;
export const LEECH_MIN_ATTEMPTS = 4;
export const LEECH_MAX_ACCURACY = 0.5;

function shuffle<T>(xs: readonly T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Draw a round from the pool. Small pools repeat (reshuffled each pass) and never
 * show the same item twice in a row when there is more than one item.
 */
export function buildRound(pool: readonly Item[], length = ROUND_LENGTH, rng: () => number = Math.random): Item[] {
  if (pool.length === 0) return [];
  const out: Item[] = [];
  while (out.length < length) {
    let pass = shuffle(pool, rng);
    if (pool.length > 1 && out.length > 0 && pass[0]!.id === out[out.length - 1]!.id) {
      pass = [...pass.slice(1), pass[0]!];
    }
    out.push(...pass.slice(0, length - out.length));
  }
  return out;
}

/** How often one item may come back in a round, so a hard item can't fill it. */
export const MAX_REQUEUES = 2;

/** Tracks requeues per item for `requeueMissed`; create one per round. */
export type RequeueLimit<T> = { counts: Map<string, number>; key: (item: T) => string };

/**
 * The item at `index` was missed: put it back REQUEUE_GAP questions later. The round
 * keeps its length, so the last question drops off. Misses too close to the end
 * aren't re-asked, and with a `limit` an item stops coming back after MAX_REQUEUES —
 * otherwise a learner stuck on one item would see nothing else.
 */
export function requeueMissed<T>(queue: readonly T[], index: number, limit?: RequeueLimit<T>): T[] {
  const item = queue[index];
  const at = index + REQUEUE_GAP;
  if (!item || at >= queue.length) return [...queue];
  if (limit) {
    const k = limit.key(item);
    const seen = limit.counts.get(k) ?? 0;
    if (seen >= MAX_REQUEUES) return [...queue];
    limit.counts.set(k, seen + 1);
  }
  const next = [...queue];
  next.splice(at, 0, item);
  next.length = queue.length;
  return next;
}

/** Items under 50% accuracy after 4 or more attempts. */
export function getLeeches(progress: Progress, items: readonly Item[]): Item[] {
  return items.filter((i) => {
    const s = progress.items[i.id];
    return !!s && s.attempts >= LEECH_MIN_ATTEMPTS && s.correct / s.attempts < LEECH_MAX_ACCURACY;
  });
}
