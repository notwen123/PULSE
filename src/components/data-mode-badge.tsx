import { cn } from "@/lib/utils";
import type { DataMode } from "@/lib/types";

/** Every data surface says whether it shows live CMC data or demo fixtures. */
export function DataModeBadge({ mode, className }: { mode: DataMode; className?: string }) {
  const live = mode === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        live ? "border-pulse/30 bg-pulse-soft text-pulse" : "border-warn/40 bg-warn-soft text-warn",
        className
      )}
      title={live ? "Values come from live CoinMarketCap API responses" : "CMC_API_KEY not set: illustrative fixture data, not live"}
    >
      <span className={cn("size-1.5 rounded-full", live ? "bg-pulse beat" : "bg-warn")} />
      {live ? "Live CMC data" : "Demo data"}
    </span>
  );
}
