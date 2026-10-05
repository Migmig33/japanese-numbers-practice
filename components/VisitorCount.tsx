"use client";

import { useEffect, useState } from "react";
import { COUNTER_URL, markCounted, parseCount, shouldCount, utcDate, visitorId } from "@/lib/visitors";

function browserStorage() {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    s.getItem("sennin.visitor");
    return s;
  } catch {
    return null;
  }
}

/**
 * Visitor badge, bottom-right. Counts this browser once a UTC day — revisits and
 * reloads add nothing. With no counter configured it renders nothing at all, so the
 * site never shows a number it hasn't really counted.
 */
export function VisitorCount() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!COUNTER_URL) return;
    const storage = browserStorage();
    const date = utcDate();
    const id = visitorId(storage);
    const fresh = !!id && shouldCount(storage, date);
    const controller = new AbortController();

    (async () => {
      try {
        const res = fresh
          ? await fetch(`${COUNTER_URL}/visit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
              signal: controller.signal,
            })
          : await fetch(`${COUNTER_URL}/count`, { signal: controller.signal });
        if (!res.ok) return;
        const count = parseCount(await res.json());
        if (count === null) return;
        if (fresh) markCounted(storage, date);
        setTotal(count);
      } catch {
        // Offline, blocked, or the counter is down: show nothing rather than a guess.
      }
    })();

    return () => controller.abort();
  }, []);

  if (total === null) return null;

  return (
    <aside
      aria-label="Visitor count"
      className="fixed right-3 z-20 rounded-full border border-hairline bg-card/95 px-3 py-1.5 text-[13px] font-bold text-muted shadow-sm backdrop-blur-sm"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <span className="text-muted">Visitors </span>
      <span className="text-primary tabular-nums">{total.toLocaleString("en")}</span>
      <span className="sr-only"> — counted once per visitor per day</span>
    </aside>
  );
}
