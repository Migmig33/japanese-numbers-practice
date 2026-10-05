import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Zen_Maru_Gothic } from "next/font/google";
import { AdScript } from "@/components/AdScript";
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
  themeColor: "#F6F4EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${zenMaru.variable} ${zenKaku.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        {children}
        <AdScript />
      </body>
    </html>
  );
}
