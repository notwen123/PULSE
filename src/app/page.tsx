import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCurrency } from "@/app/actions/currency";
import { getDailyPulse } from "@/lib/api/global";
import { dataMode, getPassport, searchRwa } from "@/lib/api/rwa";
import { toVerifyJson } from "@/lib/api/verify";
import { formatCompactMoney, formatMoney, formatUtcTime } from "@/lib/format";
import type { Passport } from "@/lib/types";
import { Hero } from "@/components/landing/hero";
import { RepresentationsObject } from "@/components/landing/representations-object";
import { Parallax, Reveal } from "@/components/landing/reveal";
import { IdentityGraph } from "@/components/rwa/identity-graph";
import { ReceiptDocument, TruthReceipt } from "@/components/receipt/truth-receipt";
import { Verified } from "@/components/verified";
import { DataModeBadge } from "@/components/data-mode-badge";

/** The one asset the landing story follows end to end. Real CMC data, never a mockup. */
async function loadFeatured(currency: string): Promise<Passport | null> {
  try {
    const { results } = await searchRwa("TSLA");
    const hit = results.find((r) => r.symbol === "TSLA") ?? results[0];
    return hit ? await getPassport(hit.rwaId, currency) : null;
  } catch {
    return null;
  }
}

function SectionHead({ n, label, title, children }: { n: string; label: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          {n} / {label.toUpperCase()}
        </span>
        <span className="rule flex-1" />
      </div>
      <h2 className="display max-w-4xl text-[2.6rem] leading-[0.95] sm:text-6xl lg:text-7xl">{title}</h2>
      {children && <div className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">{children}</div>}
    </Reveal>
  );
}

function Unavailable() {
  return (
    <p className="surface p-6 text-sm text-muted-foreground">
      The live example couldn’t load from CMC right now. Search any asset above — the Passport works the same way.
    </p>
  );
}

async function PulseTeaser({ currency }: { currency: string }) {
  const pulse = await getDailyPulse(currency);
  const cells = [
    pulse.fearGreed && { label: "Market sentiment", value: pulse.fearGreed.value, note: pulse.fearGreed.classification, receipt: pulse.fearGreed.receipt },
    pulse.altcoinSeason && { label: "Market regime", value: pulse.altcoinSeason.value, note: "Altcoin Season Index", receipt: pulse.altcoinSeason.receipt },
  ].filter((c) => !!c);
  if (!cells.length) return <p className="text-sm text-muted-foreground">Market context is unavailable right now.</p>;
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col gap-3 bg-paper p-6">
          <p className="eyebrow">{c.label}</p>
          <TruthReceipt receipt={c.receipt} display={String(c.value)}>
            <span className="flex items-end gap-3">
              <span className="font-sans text-6xl font-semibold tracking-tight tabular">{c.value}</span>
              <span className="display mb-1.5 text-2xl">{c.note}</span>
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
    featured && priceReceipt
      ? toVerifyJson(
          "rwa-quote",
          `Average tokenized price of ${featured.profile.symbol}: ${formatMoney(agg.averageTokenizedPrice, featured.currency)} (aggregate across tracked tokens).`,
          priceReceipt
        )
      : null;

  return (
    <div className="overflow-x-clip">
      <Hero mode={mode} />

      <div className="mx-auto flex max-w-7xl flex-col gap-40 px-4 pt-16 sm:px-6 lg:px-10">
        {/* 01 — Representations */}
        <section className="flex flex-col gap-12">
          <SectionHead n="01" label="Representations" title={<>One asset.<br />Many representations.</>}>
            A ticker is not an instrument. The same company can be minted by several issuers, on several chains, under names that
            look almost identical.
          </SectionHead>
          {featured ? (
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <Reveal>
                <ul className="flex flex-wrap gap-2">
                  {featured.tokens.map((t, i) => (
                    <li
                      key={t.cryptoId}
                      className="rounded-lg border bg-paper px-3 py-2"
                      style={{ transform: `rotate(${(((i * 7) % 5) - 2) * 0.6}deg)` }}
                    >
                      <p className="font-mono text-[13px] font-medium">{t.symbol}</p>
                      <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
                        {t.issuer?.name ?? "Issuer n/a"} · {t.chains[0] ?? "chain n/a"}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.15} className="flex flex-col gap-4">
                <RepresentationsObject
                  tokens={featured.tokens.map((t) => ({ symbol: t.symbol ?? `#${t.cryptoId}`, issuer: t.issuer?.name ?? null }))}
                />
                <div>
                  <p className="eyebrow">All {featured.tokens.length} point back to</p>
                  <p className="display mt-1 text-5xl">{featured.profile.name}</p>
                  <p className="mt-2 font-mono text-sm text-pulse">RWA #{featured.profile.rwaId}</p>
                </div>
              </Reveal>
            </div>
          ) : (
            <Unavailable />
          )}
        </section>

        {/* 02 — Identity */}
        <section className="flex flex-col gap-12">
          <SectionHead n="02" label="Identity" title={<>Find the asset<br />behind the token.</>}>
            CMC resolves every tokenized asset to a stable <span className="font-mono text-foreground">rwa_id</span>. PULSE builds the
            Passport around it: who issued each token, and where it lives.
          </SectionHead>
          {featured ? (
            <Reveal className="surface registered px-4 py-12 sm:px-10">
              <IdentityGraph passport={featured} compact />
              <div className="mt-10 flex justify-center">
                <Link href={`/passport/${featured.profile.rwaId}`} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-px">
                  Open the full Passport <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          ) : (
            <Unavailable />
          )}
        </section>

        {/* 03 — Context */}
        <section className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <SectionHead n="03" label="Context" title={<>CMC data<br />gives it context.</>}>
            A tokenized aggregate across every tracked representation, kept visibly separate from any single token’s price and from
            the TradFi listing.
          </SectionHead>
          {featured && agg && priceReceipt ? (
            <Reveal delay={0.1} className="flex flex-col gap-6 border-l pl-6 sm:pl-10">
              <div>
                <p className="eyebrow">{featured.profile.symbol} · average tokenized price</p>
                <TruthReceipt receipt={priceReceipt} display={formatMoney(agg.averageTokenizedPrice, featured.currency)} className="mt-2">
                  <span className="font-sans text-6xl font-semibold tracking-tight tabular sm:text-7xl">
                    {formatMoney(agg.averageTokenizedPrice, featured.currency)}
                  </span>
                </TruthReceipt>
                <p className="mt-3 text-sm text-muted-foreground">
                  CMC tracked aggregate · updated {agg.lastUpdated ? formatUtcTime(agg.lastUpdated).slice(11) : "—"}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-6 border-t pt-5">
                <div>
                  <dt className="eyebrow">Tokenized market cap</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular">{formatCompactMoney(agg.tokenizedMarketCap, featured.currency)}</dd>
                </div>
                <div>
                  <dt className="eyebrow">24h tokenized volume</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular">{formatCompactMoney(agg.tokenizedVolume24h, featured.currency)}</dd>
                </div>
              </dl>
            </Reveal>
          ) : (
            <Unavailable />
          )}
        </section>

        {/* 04 — Provenance */}
        <section className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-8">
            <SectionHead n="04" label="Provenance" title={<>Every number<br />needs provenance.</>}>
              Tap any value in PULSE and it hands you its receipt: the endpoint, the exact field, when CMC updated it, when PULSE
              fetched it, what it cost, and a fingerprint of the response.
            </SectionHead>
            <Reveal delay={0.1}>
              <ol className="flex flex-col gap-3 text-sm">
                {["Source & endpoint", "JSON field path", "CMC timestamp vs. retrieval time", "credit_count", "SHA-256 response fingerprint"].map((x, i) => (
                  <li key={x} className="flex items-baseline gap-4 border-b border-dotted pb-3">
                    <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                    {x}
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          {featured && agg && priceReceipt ? (
            <Parallax distance={50} className="mx-auto w-full max-w-lg">
              <div className="rotate-[1.2deg] overflow-hidden rounded-xl border" style={{ boxShadow: "var(--shadow-lift)" }}>
                <ReceiptDocument receipt={priceReceipt} display={formatMoney(agg.averageTokenizedPrice, featured.currency)} animate={false} />
              </div>
            </Parallax>
          ) : (
            <Unavailable />
          )}
        </section>

        {/* 05 — Ask it */}
        <section className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHead n="05" label="Evidence API" title={<>Ask it.<br />Get the receipt too.</>}>
            Scripts and agents get the same evidence as JSON from <span className="font-mono text-foreground">/api/verify</span>: an
            answer, its value, and everything needed to check it. No chatbot guessing — only fields CMC returned.
          </SectionHead>
          {verifyJson ? (
            <Reveal delay={0.1} className="overflow-hidden rounded-2xl border bg-foreground text-background">
              <div className="flex items-center justify-between border-b border-background/15 px-4 py-2.5">
                <code className="truncate font-mono text-[11.5px] opacity-80">GET /api/verify?q=rwa-quote&amp;symbol={featured!.profile.symbol}</code>
                <Link href="/developers" className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-wider uppercase opacity-80 hover:opacity-100">
                  Run live <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <pre className="max-h-[26rem] overflow-auto p-5 font-mono text-[11.5px] leading-relaxed">
                {JSON.stringify(verifyJson, null, 2)}
              </pre>
            </Reveal>
          ) : (
            <Unavailable />
          )}
        </section>

        {/* 06 — Daily Pulse */}
        <section className="flex flex-col gap-12">
          <SectionHead n="06" label="Daily Pulse" title={<>Your market,<br />in sixty seconds.</>}>
            A morning briefing: market sentiment, market regime, and the real-world assets you saved — each number with its receipt.
          </SectionHead>
          <Reveal delay={0.1} className="flex flex-col gap-4">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border bg-paper" />}>
              <PulseTeaser currency={currency} />
            </Suspense>
            <Link href="/pulse" className="inline-flex items-center gap-2 self-start text-sm underline-offset-4 hover:underline">
              Open today’s pulse <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </section>

        {/* Final */}
        <section className="flex flex-col items-start gap-10 border-t pt-20">
          <Reveal>
            <p className="display text-[3.2rem] leading-[0.92] sm:text-8xl lg:text-[8.5rem]">
              Every asset explained.
              <br />
              <span className="text-muted-foreground">Every number comes</span>
              <br />
              <span className="text-muted-foreground">with a</span> <em className="text-pulse">receipt.</em>
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <Link href="/passport" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:-translate-y-px">
              Find an asset <ArrowRight className="size-4" />
            </Link>
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">or press ⌘K anywhere</span>
            {featured && priceReceipt && <Verified status={priceReceipt.verificationStatus} />}
            <DataModeBadge mode={mode} />
          </Reveal>
        </section>
      </div>
    </div>
  );
}
