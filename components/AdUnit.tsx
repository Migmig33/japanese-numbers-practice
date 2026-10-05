"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One AdSense display unit. The <ins> has to be in the DOM before the push, and each
 * unit must be pushed exactly once — React can run an effect twice in development, so
 * the ref guards it.
 */
export function AdUnit({
  client,
  unit,
  width,
  height,
}: {
  client: string;
  unit: string;
  width: number;
  height: number;
}) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // The loader is blocked or missing; the reserved space just stays empty.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: "block", width: "100%", maxWidth: width, height }}
      data-ad-client={client}
      data-ad-slot={unit}
    />
  );
}
