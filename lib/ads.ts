/**
 * AdSense wiring, read at BUILD time. The publisher id is public — it ships in the HTML
 * of every page — so it lives in the source rather than in the deploy environment, and
 * the env var is left as an override.
 */

/** The publisher id from the AdSense dashboard. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3481135419181810";

/**
 * One ad unit id per slot size. AdSense gives these out per unit you create, so a size
 * with no id keeps its reserved space and stays empty rather than guessing an id.
 * (The keys must be written out literally — Next inlines `process.env.NEXT_PUBLIC_*`
 * only when it can see the name in the source.)
 */
export const AD_UNITS: Record<string, string> = {
  "728x90": process.env.NEXT_PUBLIC_AD_UNIT_LEADERBOARD ?? "",
  "336x280": process.env.NEXT_PUBLIC_AD_UNIT_INLINE ?? "",
  "300x600": process.env.NEXT_PUBLIC_AD_UNIT_RAIL ?? "",
};

/** The loader URL Google asks you to put in <head> on every page of the site. */
export const ADSENSE_SRC = ADSENSE_CLIENT
  ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  : "";
