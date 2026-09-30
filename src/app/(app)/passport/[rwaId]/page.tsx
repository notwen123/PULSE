import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { getCurrency } from "@/app/actions/currency";
import { CmcError, describeCmcError } from "@/lib/api/cmc";
import { getPassport } from "@/lib/api/rwa";
import { explainPassport } from "@/lib/explain";
import { ASSET_TYPE_LABEL, formatCompactMoney, formatMoney, formatUtcTime, parseAbout } from "@/lib/format";
import type { EvidenceReceipt, Passport } from "@/lib/types";
import { DataModeBadge } from "@/components/data-mode-badge";
import { ErrorState } from "@/components/state/error-state";
import { TruthReceipt } from "@/components/receipt/truth-receipt";
import { EvidenceTrail } from "@/components/receipt/evidence-trail";
import { IdentityGraph } from "@/components/rwa/identity-graph";
import { TokenCard } from "@/components/rwa/token-card";
import { SaveButton } from "@/components/rwa/save-button";
import { RecordView } from "@/components/rwa/record-view";
import { ExplainPanel } from "@/components/rwa/explain-panel";
import { AboutAsset } from "@/components/rwa/about-asset";
import { assetLogo } from "@/lib/asset-logos";

type Props = { params: Promise<{ rwaId: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function load(rwaId: number): Promise<{ passport: Passport } | { error: unknown }> {
  try {
    return { passport: await getPassport(rwaId, await getCurrency()) };
  } catch (error) {
    return { error };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).rwaId);
  return { title: id ? `RWA Passport #${id}` : "RWA Passport" };
}

function Metric({ label, receipt, display, hint }: { label: string; receipt: EvidenceReceipt; display: string; hint: string }) {
  return (
    <div className="flex flex-col gap-2 bg-paper p-5 sm:p-7">
      <p className="eyebrow">{label}</p>
      <TruthReceipt receipt={receipt} display={display}>
        <span className="font-sans text-3xl font-semibold tracking-tight tabular sm:text-4xl">{display}</span>
      </TruthReceipt>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Section({ n, eyebrow, title, children, aside }: { n: string; eyebrow: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          {n} / {eyebrow.toUpperCase()}
        </span>
        <span className="rule flex-1" />
        {aside}
      </div>
      <h2 className="display -mt-2 text-4xl sm:text-5xl">{title}</h2>
      {children}
    </section>
  );
}

export default async function PassportPage({ params }: Props) {
  const rwaId = parseId((await params).rwaId);
  if (!rwaId) notFound();

  const result = await load(rwaId);
  if ("error" in result) {
    if (result.error instanceof CmcError && (result.error.kind === "not_found" || result.error.kind === "bad_request")) notFound();
    const { title, detail } = describeCmcError(result.error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <ErrorState title={title} detail={`${detail} (RWA ID ${rwaId})`} />
      </div>
    );
  }

  const p = result.passport;
  const { profile, aggregate } = p;
  const cur = p.currency;
  const asset = { rwaId: profile.rwaId, symbol: profile.symbol, name: profile.name };
  const logo = assetLogo(profile.symbol, profile.logo);
  const price = aggregate ? formatMoney(aggregate.averageTokenizedPrice, cur) : null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-24 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <RecordView asset={asset} />

      {/* Passport header: identity left, the number that matters right */}
      <header className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <Link href="/passport" className="hover:text-foreground">Passport</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{profile.symbol}</span>
          <span className="mx-2 h-3 w-px bg-border" />
          <DataModeBadge mode={p.mode} />
        </div>

        <div className="reveal grid gap-8 border-b pb-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="flex items-start gap-5">
            {logo && (
              <Image src={logo} alt="" width={72} height={72} className="mt-2 size-14 shrink-0 rounded-2xl border bg-paper object-cover sm:size-[72px]" unoptimized={logo.startsWith("http")} />
            )}
            <div className="min-w-0">
              <p className="eyebrow">Real-world asset · {ASSET_TYPE_LABEL[profile.assetType]}</p>
              <h1 className="display mt-3 text-5xl leading-[0.92] break-words sm:text-7xl lg:text-8xl">{profile.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-mono text-lg">{profile.symbol}</span>
                <TruthReceipt receipt={p.identityReceipt} display={String(profile.rwaId)} hideCue>
                  <span className="rounded-full border border-pulse/40 bg-pulse-soft px-3 py-0.5 font-mono text-xs font-medium text-pulse">RWA #{profile.rwaId}</span>
                </TruthReceipt>
                {profile.rank != null && <span className="font-mono text-xs text-muted-foreground">Rank #{profile.rank}</span>}
                <span className="font-mono text-xs text-muted-foreground">
                  {profile.hasTokens == null ? "Tokenization not reported" : profile.hasTokens ? `${p.tokens.length} tracked tokens` : "No tracked tokens"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end lg:text-right">
            {aggregate && price ? (
              <>
                <p className="eyebrow">Average tokenized price</p>
                <TruthReceipt receipt={aggregate.receipts.averageTokenizedPrice} display={price} className="lg:items-end">
                  <span className="font-sans text-5xl font-semibold tracking-tight tabular sm:text-6xl">{price}</span>
                </TruthReceipt>
                <p className="text-xs text-muted-foreground">
                  CMC tracked aggregate{aggregate.lastUpdated ? ` · ${formatUtcTime(aggregate.lastUpdated)}` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No tokenized quote in the latest CMC response.</p>
            )}
            <SaveButton asset={asset} />
          </div>
        </div>

        {(profile.description || profile.facts.length > 0 || profile.website) && (
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
            <AboutAsset sections={parseAbout(profile.description)} />
            <dl className="grid content-start grid-cols-[8.5rem_1fr] gap-y-3 self-start text-sm md:border-l md:pl-8">
              {profile.facts.map((f) => (
                <div key={f.label} className="contents">
                  <dt className="eyebrow pt-0.5">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
              {profile.website && (
                <>
                  <dt className="eyebrow pt-0.5">Website</dt>
                  <dd>
                    <a href={profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        {p.warnings.length > 0 && (
          <ul className="flex flex-col gap-1 font-mono text-xs text-warn">
            {p.warnings.map((w) => (
              <li key={w}>! {w}</li>
            ))}
          </ul>
        )}
      </header>

      <Section n="01" eyebrow="Identity" title="What exactly is this tokenized asset?">
        <div className="surface registered px-4 py-12 sm:px-10">
          <IdentityGraph passport={p} />
        </div>
      </Section>

      <Section
        n="02"
        eyebrow="Tokenized aggregate"
        title="Across all tracked representations"
        aside={<span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">values in {cur}</span>}
      >
        {aggregate ? (
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3" style={{ boxShadow: "var(--shadow-paper)" }}>
            <Metric
              label="Average tokenized price"
              receipt={aggregate.receipts.averageTokenizedPrice}
              display={formatMoney(aggregate.averageTokenizedPrice, cur)}
              hint="An aggregate — not the executable price of any single token"
            />
            <Metric
              label="Tokenized market cap"
              receipt={aggregate.receipts.tokenizedMarketCap}
              display={formatCompactMoney(aggregate.tokenizedMarketCap, cur)}
              hint="Across tracked tokens"
            />
            <Metric
              label="24h tokenized volume"
              receipt={aggregate.receipts.tokenizedVolume24h}
              display={formatCompactMoney(aggregate.tokenizedVolume24h, cur)}
              hint="CMC-tracked, last 24 hours"
            />
          </div>
        ) : (
          <ErrorState compact title="Quote unavailable" detail="CMC did not return a tokenized aggregate quote for this asset right now." />
        )}
      </Section>

      <Section
        n="03"
        eyebrow="Individual representations"
        title={`${p.tokens.length} tracked token${p.tokens.length === 1 ? "" : "s"}`}
        aside={
          p.tokens.some((t) => t.currency !== cur) ? (
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Token prices in {p.tokens[0]?.currency}, as returned by CMC</span>
          ) : undefined
        }
      >
        {p.tokens.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.tokens.map((t) => (
              <TokenCard key={t.cryptoId} token={t} />
            ))}
          </div>
        ) : (
          <p className="surface p-5 text-sm text-muted-foreground">
            {profile.hasTokens === false ? "CMC reports no tokenized representations for this asset." : "No token representations were returned in the latest CMC quote."}
          </p>
        )}
      </Section>

      {p.tradfi.length > 0 && (
        <Section n="04" eyebrow="TradFi reference" title="Where the underlying asset trades">
          <div className="overflow-hidden rounded-2xl border bg-paper">
            {p.tradfi.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-4 border-b px-5 py-3.5 text-sm last:border-b-0">
                <span className="font-medium">{t.venue ?? "Venue not reported"}</span>
                <span className="font-mono text-muted-foreground">{t.ticker ?? "—"}</span>
                {t.price != null ? (
                  <span className="font-mono tabular">{formatMoney(t.price, t.currency ?? cur)}</span>
                ) : t.url ? (
                  <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline">
                    Market page <ArrowUpRight className="size-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No price in CMC data</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Reference only, as listed by CMC. These venues are separate from the on-chain tokens above.</p>
        </Section>
      )}

      <ExplainPanel lines={explainPassport(p)} />
      <EvidenceTrail responses={p.responses} />
    </div>
  );
}
