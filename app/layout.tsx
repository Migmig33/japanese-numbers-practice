import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Zen_Maru_Gothic } from "next/font/google";
import { AdScript } from "@/components/AdScript";
import { SakuraFall } from "@/components/SakuraFall";
import { VisitorCount } from "@/components/VisitorCount";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-zen-maru",
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-zen-kaku",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  applicationName: SITE_NAME,
};

export const viewport: Viewport = {
  themeColor: "#151B26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${zenMaru.variable} ${zenKaku.variable}`}>
      {/* No background on the body: <html> carries it so the sakura can sit behind. */}
      <body className="min-h-dvh text-ink antialiased">
        <SakuraFall />
        {children}
        <VisitorCount />
        <AdScript />
      </body>
    </html>
  );
}
