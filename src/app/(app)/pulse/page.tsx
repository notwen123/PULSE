import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrency } from "@/app/actions/currency";
import { getDailyPulse } from "@/lib/api/global";
import { formatCompactMoney, formatPercent } from "@/lib/format";
import type { EvidenceReceipt } from "@/lib/types";
import { TruthReceipt } from "@/components/receipt/truth-receipt";
import { SavedSnapshots } from "@/components/rwa/saved-snapshots";
import { ExplorerProgress } from "@/components/pulse/explorer-progress";
import { Greeting } from "@/components/pulse/greeting";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Daily Pulse" };

/** A thin 0–100 scale with a single ink marker. */
function Scale({ value, left, right }: { value: number; left: string; right: string }) {
  return (
    <div className="mt-6">
      <div className="relative h-px bg-foreground/25">
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute -top-1 h-2 w-px bg-foreground/25" style={{ left: `${t}%` }} />
        ))}
        <span className="absolute -top-[5px] size-[11px] -translate-x-1/2 rounded-full border-2 border-background bg-pulse" style={{ left: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function season(v: number) {
  if (v >= 75) return "Altcoin season";
  if (v <= 25) return "Bitcoin season";
  return "Neither season";
}

function MarketSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2">
        <div className="h-60 animate-pulse bg-paper" />
        <div className="h-60 animate-pulse bg-paper" />
      </div>
      <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">Reading Fear &amp; Greed, Altcoin Season and global metrics from CMC…</p>
    </div>
  );
}

async function PulseMarket({ currency }: { currency: string }) {
  const pulse = await getDailyPulse(currency);
  const cur = currency.toUpperCase();
  const g = pulse.global;

  return (
    <div className="flex flex-col gap-16">
      <section className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2" style={{ boxShadow: "var(--shadow-paper)" }}>
        <div className="bg-paper p-7 sm:p-10">
          <p className="eyebrow">01 · Market sentiment</p>
          {pulse.fearGreed ? (
            <>
              <TruthReceipt receipt={pulse.fearGreed.receipt} display={String(pulse.fearGreed.value)} className="mt-5">
                <span className="flex items-end gap-4">
                  <span className="font-sans text-8xl font-semibold tracking-tighter tabular">{pulse.fearGreed.value}</span>
                  {pulse.fearGreed.classification && <span className="display mb-3 text-4xl">{pulse.fearGreed.classification}</span>}
                </span>
              </TruthReceipt>
              <Scale value={pulse.fearGreed.value} left="Extreme fear" right="Extreme greed" />
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">The Fear &amp; Greed Index is unavailable right now.</p>
          )}
        </div>
        <div className="bg-paper p-7 sm:p-10">
          <p className="eyebrow">02 · Market regime</p>
          {pulse.altcoinSeason ? (
            <>
              <TruthReceipt receipt={pulse.altcoinSeason.receipt} display={String(pulse.altcoinSeason.value)} className="mt-5">
                <span className="flex items-end gap-4">
                  <span className="font-sans text-8xl font-semibold tracking-tighter tabular">{pulse.altcoinSeason.value}</span>
                  <span className="display mb-3 text-4xl">{season(pulse.altcoinSeason.value)}</span>
                </span>
              </TruthReceipt>
              <Scale value={pulse.altcoinSeason.value} left="Bitcoin season" right="Altcoin season" />
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">The Altcoin Season Index is unavailable right now.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">03 / GLOBAL MARKET</span>
          <span className="rule flex-1" />
        </div>
        {g ? (
          <>
            <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
              {(
                [
                  ["Total market cap", g.receipts.totalMarketCap, formatCompactMoney(g.totalMarketCap, cur)],
                  ["24h volume", g.receipts.totalVolume24h, formatCompactMoney(g.totalVolume24h, cur)],
                  ["BTC dominance", g.receipts.btcDominance, formatPercent(g.btcDominance)],
                  ["ETH dominance", g.receipts.ethDominance, formatPercent(g.ethDominance)],
                ] satisfies [string, EvidenceReceipt, string][]
              ).map(([label, receipt, display]) => (
                <div key={label} className="flex flex-col gap-2 border-l pl-5">
                  <dt className="eyebrow">{label}</dt>
                  <dd>
                    <TruthReceipt receipt={receipt} display={display}>
                      <span className="font-sans text-3xl font-semibold tracking-tight tabular">{display}</span>
                    </TruthReceipt>
                  </dd>
                </div>
              ))}
            </dl>
            {g.marketCapChange24h != null && (
              <p className="display text-2xl">
                Total market cap is{" "}
                <span className={cn(g.marketCapChange24h >= 0 ? "text-up" : "text-down")}>{formatPercent(g.marketCapChange24h, { signed: true })}</span>{" "}
                versus yesterday, per CMC.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Global metrics need a CMC API key (/v1/global-metrics/quotes/latest).</p>
        )}
      </section>

      {pulse.errors.length > 0 && <p className="font-mono text-[11px] text-muted-foreground">Partially loaded: {pulse.errors.join(" · ")}</p>}
    </div>
  );
}

export default async function PulsePage() {
  const currency = await getCurrency();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <header className="flex flex-col gap-5 border-b pb-10">
        <p className="eyebrow">Today’s pulse · {today}</p>
        <h1 className="display text-6xl leading-[0.92] sm:text-8xl">
          <Greeting />.
        </h1>
        <p className="max-w-lg text-[15px] text-muted-foreground">Sentiment, regime, the wider market — then the real-world assets you follow. About a minute.</p>
        <ExplorerProgress />
      </header>

      <Suspense fallback={<MarketSkeleton />}>
        <PulseMarket currency={currency} />
      </Suspense>

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">04 / YOUR RWAS</span>
          <span className="rule flex-1" />
        </div>
        <SavedSnapshots currency={currency} />
      </section>
    </div>
  );
}
