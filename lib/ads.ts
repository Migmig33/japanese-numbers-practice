/**
 * AdSense wiring. Everything here is read at BUILD time, and every piece is optional:
 * with no publisher id set the site renders no ad code at all, which is what we want
 * before the account is approved.
 */

/** The publisher id from the AdSense dashboard, e.g. "ca-pub-1234567890123456". */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

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
