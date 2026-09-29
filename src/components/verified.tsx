import { Check, FlaskConical, Minus, TriangleAlert } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const COPY: Record<VerificationStatus, { short: string; long: string }> = {
  verified: { short: "CMC sourced", long: "Verified from CMC response" },
  demo: { short: "Demo data", long: "Demo data — not a live CMC response" },
  unavailable: { short: "Not in CMC data", long: "Not available in CMC data" },
  error: { short: "Source error", long: "CMC request failed" },
};

const ICON = { verified: Check, demo: FlaskConical, unavailable: Minus, error: TriangleAlert } as const;

/**
 * The single visual language for provenance. Used on metrics, receipts,
 * Daily Pulse and the Evidence API page so "verified" always looks the same.
 */
export function Verified({
  status,
  size = "sm",
  className,
}: {
  status: VerificationStatus;
  size?: "sm" | "lg";
  className?: string;
}) {
  const Icon = ICON[status];
  const ok = status === "verified";
  if (size === "lg") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          ok ? "border-pulse/35 bg-pulse-soft text-pulse" : status === "demo" ? "border-warn/40 bg-warn-soft text-warn" : "bg-muted text-muted-foreground",
          className
        )}
      >
        <span className={cn("relative grid size-6 place-items-center rounded-full", ok ? "bg-pulse text-pulse-foreground" : "border border-current")}>
          {ok && <span className="ring-out absolute inset-0 rounded-full border border-pulse" aria-hidden />}
          <Icon className="size-3.5" strokeWidth={2.5} />
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">{COPY[status].long}</span>
      </div>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase",
        ok ? "text-pulse" : status === "demo" ? "text-warn" : "text-muted-foreground",
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {COPY[status].short}
    </span>
  );
}
