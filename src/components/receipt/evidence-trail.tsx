import { formatUtcTime, shortHash } from "@/lib/format";
import type { ResponseMeta } from "@/lib/types";

/** Every CMC response behind a page, with its fingerprint. */
export function EvidenceTrail({ responses }: { responses: ResponseMeta[] }) {
  if (!responses.length) return null;
  return (
    <section>
      <p className="eyebrow">Evidence trail</p>
      <div className="mt-3 overflow-hidden rounded-2xl border bg-paper">
        {responses.map((r) => (
          <div key={r.responseHash + r.endpoint} className="grid gap-1 border-b px-4 py-3 text-xs last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6">
            <span className="font-mono text-[12px] break-all">GET {r.endpoint}{Object.keys(r.params).length ? `?${new URLSearchParams(r.params)}` : ""}</span>
            <span className="text-muted-foreground">{formatUtcTime(r.retrievedAt)}</span>
            <span className="text-muted-foreground">{r.creditCount != null ? `${r.creditCount} credit${r.creditCount === 1 ? "" : "s"}` : r.mode === "demo" ? "demo" : "credits n/a"}</span>
            <span className="font-mono text-muted-foreground">{shortHash(r.responseHash)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
