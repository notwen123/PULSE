import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RwaSearch } from "@/components/rwa/rwa-search";
import { TruthReceipt } from "@/components/receipt/truth-receipt";
import { Verified } from "@/components/verified";
import { assetLogo } from "@/lib/asset-logos";
import { ASSET_TYPE_LABEL, formatMoney } from "@/lib/format";
import type { DataMode, Passport } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The answer, shown flat: one asset, its RWA ID, its verified price, every token behind it. */
function PassportPreview({ p }: { p: Passport }) {
  const { profile, aggregate, tokens, issuers, chains } = p;
  const logo = assetLogo(profile.symbol, profile.logo);
  const price = aggregate ? formatMoney(aggregate.averageTokenizedPrice, p.currency) : null;

  return (
    <div className="surface overflow-hidden" style={{ boxShadow: "var(--shadow-lift)" }}>
      <div className="flex items-center gap-3 border-b p-5">
        {logo && <Image src={logo} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" unoptimized={logo.startsWith("http")} />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{profile.name}</p>
          <p className="text-sm text-muted-foreground">
            {profile.symbol} · {ASSET_TYPE_LABEL[profile.assetType]}
          </p>
        </div>
        <span className="rounded-full bg-pulse-soft px-2.5 py-1 font-mono text-xs font-medium text-pulse">RWA #{profile.rwaId}</span>
      </div>

      {aggregate && price && (
        <div className="flex items-end justify-between gap-4 border-b p-5">
          <div>
            <p className="text-sm text-muted-foreground">Average tokenized price</p>
            <TruthReceipt receipt={aggregate.receipts.averageTokenizedPrice} display={price} className="mt-1">
              <span className="text-3xl font-semibold tracking-tight tabular">{price}</span>
            </TruthReceipt>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {tokens.length} tokens · {issuers.length} issuers
            <br />
            {chains.length} chains
          </p>
        </div>
      )}

      <ul className="max-h-[17rem] divide-y overflow-y-auto">
        {tokens.map((t) => (
          <li key={t.cryptoId} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 px-5 py-2.5 text-sm">
            <span className="truncate font-mono text-[13px] font-medium">{t.symbol}</span>
            <span className="truncate text-muted-foreground">{t.issuer?.name ?? "Issuer not in CMC data"}</span>
            <span className="truncate text-xs text-muted-foreground">{t.chains[0] ?? "—"}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/passport/${profile.rwaId}`}
        className="flex items-center justify-between border-t bg-muted/50 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        Open the full passport <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export function Hero({ featured, mode }: { featured: Passport | null; mode: DataMode }) {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20">
      <div className="flex min-w-0 flex-col">
        <p className="inline-flex items-center gap-2 self-start rounded-full border bg-paper px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", mode === "live" ? "bg-pulse" : "bg-warn")} />
          {mode === "live" ? "Live CoinMarketCap data" : "Demo data"}
        </p>
        <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
          What exactly are you <span className="text-pulse">buying?</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          One company can hide behind a dozen tokens, issuers and chains. PULSE finds the real-world asset behind each one — and
          gives every number a receipt from CoinMarketCap.
        </p>
        <div className="mt-8">
          <RwaSearch />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Verified status="verified" /> on every key number
          </span>
          <Link href="/developers" className="underline-offset-4 hover:text-foreground hover:underline">
            Evidence API →
          </Link>
        </div>
      </div>
      <div className="min-w-0">
        {featured ? <PassportPreview p={featured} /> : <p className="text-sm text-muted-foreground">The live preview couldn’t load from CMC right now.</p>}
      </div>
    </section>
  );
}
