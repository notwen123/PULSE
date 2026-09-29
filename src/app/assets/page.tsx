import type { Metadata } from "next";
import Link from "next/link";
import { getCurrency } from "@/app/actions/currency";
import { describeCmcError } from "@/lib/api/cmc";
import { listRwas } from "@/lib/api/rwa";
import { ASSET_TYPE_LABEL, formatCompactMoney, formatMoney } from "@/lib/format";
import { DataModeBadge } from "@/components/data-mode-badge";
import { ErrorState } from "@/components/state/error-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "All RWAs" };

const TYPES = ["stock", "commodity", "currency", "government_security", "etf", "real_estate"] as const;

type Props = { searchParams: Promise<{ type?: string }> };

export default async function AssetsPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const assetType = TYPES.find((t) => t === type);
  const currency = await getCurrency();
  const result = await listRwas({ currency, assetType }).catch((e: unknown) => e as Error);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore</p>
          <h1 className="mt-2 display text-5xl sm:text-6xl">All tracked RWAs</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Ranked by CMC rwa_rank, with tokenized aggregate quotes from /v5/real-world-assets/assets/list.</p>
        </div>
        {!(result instanceof Error) && <DataModeBadge mode={result.mode} />}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by asset type">
        {[undefined, ...TYPES].map((t) => (
          <Link
            key={t ?? "all"}
            href={t ? `/assets?type=${t}` : "/assets"}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              t === assetType ? "border-foreground bg-foreground text-background" : "bg-paper hover:bg-muted"
            )}
          >
            {t ? ASSET_TYPE_LABEL[t] : "All"}
          </Link>
        ))}
      </nav>

      {result instanceof Error ? (
        <ErrorState {...describeCmcError(result)} />
      ) : result.rows.length === 0 ? (
        <p className="surface p-6 text-sm text-muted-foreground">CMC returned no RWAs for this filter.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-paper">
          <div className="hidden grid-cols-[3rem_1fr_9rem_8rem_8rem] gap-4 border-b px-5 py-2.5 text-xs text-muted-foreground md:grid">
            <span>Rank</span><span>Asset</span><span className="text-right">Avg tokenized price</span><span className="text-right">Tokenized mcap</span><span className="text-right">24h volume</span>
          </div>
          {result.rows.map((r) => (
            <Link
              key={r.rwaId}
              href={`/passport/${r.rwaId}`}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/50 md:grid-cols-[3rem_1fr_9rem_8rem_8rem]"
            >
              <span className="hidden font-mono text-sm text-muted-foreground md:block">{r.rank ?? "—"}</span>
              <span className="min-w-0">
                <span className="font-mono text-sm font-medium">{r.symbol}</span>{" "}
                <span className="text-sm text-muted-foreground">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{ASSET_TYPE_LABEL[r.assetType]} · rwa_id {r.rwaId}</span>
              </span>
              <span className="text-right font-mono text-sm tabular">{formatMoney(r.averageTokenizedPrice, result.currency)}</span>
              <span className="hidden text-right font-mono text-sm text-muted-foreground tabular md:block">{formatCompactMoney(r.tokenizedMarketCap, result.currency)}</span>
              <span className="hidden text-right font-mono text-sm text-muted-foreground tabular md:block">{formatCompactMoney(r.tokenizedVolume24h, result.currency)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
