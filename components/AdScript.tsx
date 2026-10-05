import Script from "next/script";

/**
 * Loads the ad network, if one is configured. Swap networks by changing
 * NEXT_PUBLIC_AD_SCRIPT_SRC; slots are plain `.ad-slot[data-ad-size]` divs.
 */
export function AdScript() {
  const src = process.env.NEXT_PUBLIC_AD_SCRIPT_SRC;
  if (!src) return null;
  return <Script src={src} strategy="afterInteractive" crossOrigin="anonymous" />;
}
