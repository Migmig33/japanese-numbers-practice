import Script from "next/script";
import { ADSENSE_SRC } from "@/lib/ads";

/**
 * Loads the ad network, if one is configured. AdSense needs its loader in the HTML the
 * crawler sees, so it goes in with `beforeInteractive` from the root layout — Next hoists
 * that into <head>. Any other network can be dropped in with NEXT_PUBLIC_AD_SCRIPT_SRC;
 * slots are plain `.ad-slot[data-ad-size]` divs.
 */
export function AdScript() {
  const other = process.env.NEXT_PUBLIC_AD_SCRIPT_SRC;
  if (ADSENSE_SRC) {
    return <Script id="adsense-loader" src={ADSENSE_SRC} strategy="beforeInteractive" crossOrigin="anonymous" />;
  }
  if (other) return <Script src={other} strategy="afterInteractive" crossOrigin="anonymous" />;
  return null;
}
