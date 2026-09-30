import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCurrency } from "@/app/actions/currency";
import { getDailyPulse } from "@/lib/api/global";
import { dataMode, getPassport, searchRwa } from "@/lib/api/rwa";
import { toVerifyJson } from "@/lib/api/verify";
import { formatMoney } from "@/lib/format";
import type { Passport } from "@/lib/types";
import { Hero } from "@/components/landing/hero";
import { Reveal } from "@/components/landing/reveal";
import { IdentityGraph } from "@/components/rwa/identity-graph";
import { ReceiptDocument, TruthReceipt } from "@/components/receipt/truth-receipt";

/** The one asset the landing follows end to end. Real CMC data, never a mockup. */
async function loadFeatured(currency: string): Promise<Passport | null> {
  try {
    const { results } = await searchRwa("TSLA");
    const hit = results.find((r) => r.symbol === "TSLA") ?? results[0];
    return hit ? await getPassport(hit.rwaId, currency) : null;
  } catch {
    return null;
  }
}

function Head({ n, title, children }: { n: string; title: string; children?: React.ReactNode }) {
  return (
    <Reveal className="flex max-w-2xl flex-col gap-3">
      <p className="text-sm font-medium text-pulse">{n}</p>
      <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h2>
      {children && <p className="text-lg leading-relaxed text-muted-foreground">{children}</p>}
    </Reveal>
  );
}

async function PulseTeaser({ currency }: { currency: string }) {
  const pulse = await getDailyPulse(currency);
  const cells = [
    pulse.fearGreed && { label: "Market sentiment", value: pulse.fearGreed.value, note: pulse.fearGreed.classification ?? "", receipt: pulse.fearGreed.receipt },
    pulse.altcoinSeason && { label: "Altcoin Season Index", value: pulse.altcoinSeason.value, note: "out of 100", receipt: pulse.altcoinSeason.receipt },
  ].filter((c) => !!c);
  if (!cells.length) return <p className="text-sm text-muted-foreground">Market context is unavailable right now.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cells.map((c) => (
        <div key={c.label} className="surface p-6">
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <TruthReceipt receipt={c.receipt} display={String(c.value)} className="mt-2">
            <span className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight tabular">{c.value}</span>
              <span className="text-lg text-muted-foreground">{c.note}</span>
            </span>
          </TruthReceipt>
        </div>
      ))}
    </div>
  );
}

export default async function Landing() {
  const currency = await getCurrency();
  const featured = await loadFeatured(currency);
  const mode = dataMode();
  const agg = featured?.aggregate;
  const priceReceipt = agg?.receipts.averageTokenizedPrice;
  const verifyJson =
    featured && agg && priceReceipt
      ? toVerifyJson(
          "rwa-quote",
          `Average tokenized price of ${featured.profile.symbol}: ${formatMoney(agg.averageTokenizedPrice, featured.currency)} (aggregate across tracked tokens).`,
          priceReceipt
        )
      : null;

  return (
    <>
      <Hero featured={featured} mode={mode} />

      <div className="mx-auto flex max-w-6xl flex-col gap-28 px-4 sm:px-6">
        {/* 01 — Identity */}
        {featured && (
          <section className="flex flex-col gap-10">
            <Head n="01 · Identity" title="Find the asset behind the token.">
              CMC resolves every tokenized asset to one stable RWA ID. PULSE shows who issued each token and which chain it lives on.
            </Head>
            <Reveal className="surface px-4 py-10 sm:px-10">
              <IdentityGraph passport={featured} compact />
            </Reveal>
          </section>
        )}

        {/* 02 — Receipt */}
        {featured && agg && priceReceipt && (
          <section id="provenance" className="grid scroll-mt-24 gap-10 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-6">
              <Head n="02 · Receipt" title="Every number comes with a receipt.">
                Tap any value to see the exact CMC endpoint and field, CMC’s timestamp, when PULSE fetched it, the credit cost and a
                SHA-256 fingerprint of the response.
              </Head>
            </div>
            <Reveal className="overflow-hidden rounded-2xl border" >
              <ReceiptDocument receipt={priceReceipt} display={formatMoney(agg.averageTokenizedPrice, featured.currency)} animate={false} />
            </Reveal>
          </section>
        )}

        {/* 03 — Evidence API */}
        {verifyJson && (
          <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Head n="03 · Evidence API" title="Agents get the proof too.">
              The same receipts as JSON from /api/verify: the answer, the value, and everything needed to check it.
            </Head>
            <Reveal className="overflow-hidden rounded-2xl border bg-foreground text-background">
              <div className="flex items-center justify-between border-b border-background/15 px-4 py-2.5 text-xs">
                <code className="truncate font-mono opacity-80">GET /api/verify?q=rwa-quote&amp;symbol={featured!.profile.symbol}</code>
                <Link href="/developers" className="inline-flex shrink-0 items-center gap-1 opacity-80 hover:opacity-100">
                  Run live <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <pre className="max-h-96 overflow-auto p-5 font-mono text-[12px] leading-relaxed">{JSON.stringify(verifyJson, null, 2)}</pre>
            </Reveal>
          </section>
        )}

        {/* 04 — Daily Pulse */}
        <section className="flex flex-col gap-10">
          <Head n="04 · Daily Pulse" title="Your market in sixty seconds.">
            Sentiment, market regime and the assets you saved — each number with its receipt.
          </Head>
          <Suspense fallback={<div className="h-36 animate-pulse rounded-2xl border bg-paper" />}>
            <PulseTeaser currency={currency} />
          </Suspense>
        </section>

        {/* CTA */}
        <section className="surface flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Every asset explained.</h2>
            <p className="mt-2 text-lg text-muted-foreground">Every number comes with a receipt.</p>
          </div>
          <Link href="/passport" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Explore assets <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
