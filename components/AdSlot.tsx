export type AdSize = "728x90" | "336x280" | "300x600";

const DIMENSIONS: Record<AdSize, { w: number; h: number }> = {
  "728x90": { w: 728, h: 90 },
  "336x280": { w: 336, h: 280 },
  "300x600": { w: 300, h: 600 },
};

/**
 * Reserves the slot's space so ads never shift the layout. In development it shows a
 * labeled placeholder; in production it's an empty container the ad network fills
 * (see AdScript). Never place one inside an active quiz question.
 */
export function AdSlot({ size, className = "" }: { size: AdSize; className?: string }) {
  const { w, h } = DIMENSIONS[size];
  const style = { width: "100%", maxWidth: w, height: h };
  const label = `Advertisement ${w}×${h}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <div
        className={`mx-auto flex items-center justify-center rounded-lg border-2 border-dashed border-hairline text-[13px] font-medium text-muted ${className}`}
        style={style}
        aria-hidden="true"
      >
        {label}
      </div>
    );
  }

  return <div className={`ad-slot mx-auto ${className}`} style={style} data-ad-size={size} aria-label="Advertisement" />;
}
