import { useCallback, useSyncExternalStore } from "react";
import { levelForXp } from "./scoring";
import { clampStage, type StageId } from "./stages";

export const STORAGE_KEY = "sennin.v1";

export type ItemStats = { attempts: number; correct: number };

export type Progress = {
  v: 1;
  items: Record<string, ItemStats>;
  xp: number;
  level: number;
  bestScore: number;
  roundsPlayed: number;
  /** ISO dates (YYYY-MM-DD) with at least one finished round, sorted, unique. */
  days: string[];
  /** Highest numbers-quiz stage opened so far. */
  stage: StageId;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function emptyProgress(): Progress {
  return { v: 1, items: {}, xp: 0, level: 1, bestScore: 0, roundsPlayed: 0, days: [], stage: 1 };
}

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0);

/** Parse stored JSON, keeping whatever is valid and dropping the rest. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!data || typeof data !== "object" || (data as { v?: unknown }).v !== 1) return emptyProgress();
  const d = data as Record<string, unknown>;
  const items: Record<string, ItemStats> = {};
  if (d.items && typeof d.items === "object") {
    for (const [id, s] of Object.entries(d.items as Record<string, unknown>)) {
      if (!s || typeof s !== "object") continue;
      const { attempts, correct } = s as Record<string, unknown>;
      items[id] = { attempts: num(attempts), correct: Math.min(num(correct), num(attempts)) };
    }
  }
  const xp = num(d.xp);
  const days = Array.isArray(d.days)
    ? [...new Set(d.days.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)))].sort()
    : [];
  return {
    v: 1, items, xp, level: levelForXp(xp), bestScore: num(d.bestScore),
    roundsPlayed: num(d.roundsPlayed), days, stage: clampStage(d.stage),
  };
}

export function loadProgress(storage: StorageLike | null): Progress {
  if (!storage) return emptyProgress();
  try {
    return parseProgress(storage.getItem(STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

/** Returns false when storage is unavailable or full; the caller keeps its in-memory copy. */
export function saveProgress(progress: Progress, storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function recordAnswer(progress: Progress, itemId: string, correct: boolean): Progress {
  const prev = progress.items[itemId] ?? { attempts: 0, correct: 0 };
  return {
    ...progress,
    items: { ...progress.items, [itemId]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0) } },
  };
}

export function recordRound(progress: Progress, { score, date }: { score: number; date: string }): Progress {
  const xp = progress.xp + score;
  return {
    ...progress,
    xp,
    level: levelForXp(xp),
    bestScore: Math.max(progress.bestScore, score),
    roundsPlayed: progress.roundsPlayed + 1,
    days: progress.days.includes(date) ? progress.days : [...progress.days, date].sort(),
  };
}

/** Opening a stage never closes one already open. */
export function unlockStage(progress: Progress, stage: StageId): Progress {
  return stage > progress.stage ? { ...progress, stage } : progress;
}

export function accuracy(stats: ItemStats | undefined): number | null {
  return stats && stats.attempts > 0 ? stats.correct / stats.attempts : null;
}

/** Local calendar date as YYYY-MM-DD. */
export function isoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---- Client store ------------------------------------------------------------------
// One in-memory copy per tab, persisted best-effort. If localStorage throws (private
// browsing, blocked cookies) the session simply keeps working from memory.

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    s.getItem(STORAGE_KEY); // throws in some private modes
    return s;
  } catch {
    return null;
  }
}

const SERVER_SNAPSHOT = emptyProgress();
let current: Progress | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Progress {
  if (!current) current = loadProgress(browserStorage());
  return current;
}

function emit() {
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  current = parseProgress(e.newValue);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function updateProgress(fn: (p: Progress) => Progress) {
  current = fn(getSnapshot());
  saveProgress(current, browserStorage());
  emit();
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const update = useCallback((fn: (p: Progress) => Progress) => updateProgress(fn), []);
  return { progress, update };
}
