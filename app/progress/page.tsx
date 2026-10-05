import type { Metadata } from "next";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Column, SiteFrame } from "@/components/PageShell";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { RelatedCards } from "@/components/RelatedCards";
import { pageMetadata, PAGES } from "@/lib/site";

// Per-browser stats: useful to visitors, not to search engines.
export function generateMetadata(): Metadata {
  return pageMetadata("progress", { robots: { index: false, follow: true } });
}

export default function ProgressPage() {
  return (
    <SiteFrame current="progress">
      <Column>
        <Breadcrumb name={PAGES.progress.name} path={PAGES.progress.path} />
        <AdSlot size="728x90" />
        <h1 className="mt-8 text-h1 text-primary">Your progress</h1>
        <p className="mt-4 text-ink/90">
          Everything here is stored only in this browser — there are no accounts. Clearing your browser data resets it.
        </p>
      </Column>
      <div className="mx-auto my-10 max-w-widget">
        <ProgressDashboard />
      </div>
      <Column>
        <AdSlot size="336x280" className="my-12" />
        <RelatedCards pages={["numbers", "time", "writing"]} />
      </Column>
    </SiteFrame>
  );
}
