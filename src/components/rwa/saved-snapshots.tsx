"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toggleSaved, useSaved } from "@/lib/local";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { DataMode, RwaListRow } from "@/lib/types";
import { DataModeBadge } from "@/components/data-mode-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/state/error-state";

type Snap = { rows: RwaListRow[]; currency: string; mode: DataMode };

/** Saved RWAs with one batched /v5/real-world-assets/quotes/latest call. */
export function SavedSnapshots({ currency, editable = false, emptyHint }: { currency: string; editable?: boolean; emptyHint?: React.ReactNode }) {
  const saved = useSaved();
  const ids = saved.map((s) => s.rwaId).join(",");
  const [data, setData] = useState<{ key: string; snap?: Snap; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${ids}|${currency}|${attempt}`;

  useEffect(() => {
    if (!ids) return;
    const ctrl = new AbortController();
    fetch(`/api/rwa/quotes?rwa_id=${ids}&convert=${currency}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        setData(r.ok ? { key, snap: body } : { key, error: body?.error?.title ?? "CMC couldn’t return quotes right now." });
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setData({ key, error: "Couldn’t reach PULSE." });
      });
    return () => ctrl.abort();
  }, [ids, currency, key]);

  if (!saved.length) {
    return (
      <div className="surface p-6 text-sm text-muted-foreground">
        {emptyHint ?? "No saved RWAs yet. Open any Passport and tap Save."}
      </div>
    );
  }

  const current = data?.key === key ? data : null;
  if (current?.error) return <ErrorState compact title={current.error} onRetry={() => setAttempt((a) => a + 1)} />;
  const rows = new Map(current?.snap?.rows.map((r) => [r.rwaId, r]));

  return (
    <div className="flex flex-col gap-2">
      {current?.snap && <DataModeBadge mode={current.snap.mode} className="self-start" />}
      <div className="overflow-hidden rounded-2xl border bg-paper">
        {saved.map((s) => {
          const r = rows.get(s.rwaId);
          return (
            <div key={s.rwaId} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
              <Link href={`/passport/${s.rwaId}`} className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{s.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{s.name} · rwa_id {s.rwaId}</p>
              </Link>
              {!current ? (
                <Skeleton className="h-8 w-24" />
              ) : r ? (
                <div className="text-right">
                  <p className="font-mono text-sm font-medium tabular">{formatMoney(r.averageTokenizedPrice, current.snap?.currency)}</p>
                  <p className="text-xs text-muted-foreground">mcap {formatCompactMoney(r.tokenizedMarketCap, current.snap?.currency)}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Quote unavailable</p>
              )}
              {editable && (
                <button onClick={() => toggleSaved(s)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Remove ${s.symbol}`}>
                  <X className="size-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Average tokenized price · /v5/real-world-assets/quotes/latest</p>
    </div>
  );
}
