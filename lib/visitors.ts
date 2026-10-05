/*
 * Visitor counting. One visit counts once per browser per day: leaving and coming back,
 * or reloading, adds nothing until the date rolls over. The browser keeps a random id
 * and the date it last counted; the id is the only thing ever sent to the counter.
 */

export const VISITOR_ID_KEY = "sennin.visitor";
export const LAST_COUNTED_KEY = "sennin.visit";

export type VisitorStorage = Pick<Storage, "getItem" | "setItem">;

/** UTC so the browser and the counter agree on when the day turns over. */
export function utcDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function randomId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** The browser's own id, created on first use. Not tied to any person. */
export function visitorId(storage: VisitorStorage | null): string | null {
  if (!storage) return null;
  try {
    const existing = storage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    storage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
}

/** True when this browser has not yet been counted on `date`. */
export function shouldCount(storage: VisitorStorage | null, date: string): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(LAST_COUNTED_KEY) !== date;
  } catch {
    return false;
  }
}

export function markCounted(storage: VisitorStorage | null, date: string): void {
  try {
    storage?.setItem(LAST_COUNTED_KEY, date);
  } catch {
    /* private browsing; the counter just dedupes on its own side */
  }
}

/** Where to count. Unset means the badge stays hidden rather than showing a made-up number. */
export const COUNTER_URL = (process.env.NEXT_PUBLIC_VISITOR_COUNTER_URL ?? "").replace(/\/+$/, "");

export function parseCount(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const total = (data as { total?: unknown }).total;
  return typeof total === "number" && Number.isFinite(total) && total >= 0 ? Math.floor(total) : null;
}
