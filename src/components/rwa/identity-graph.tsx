import Image from "next/image";
import Link from "next/link";
import { assetLogo } from "@/lib/asset-logos";
import { ASSET_TYPE_LABEL } from "@/lib/format";
import type { Passport, TokenRepresentation } from "@/lib/types";
import { cn } from "@/lib/utils";

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

function Stem({ delay, className }: { delay: number; className?: string }) {
  return <div className={cn("draw mx-auto h-8 w-px bg-foreground/30", className)} style={d(delay)} aria-hidden />;
}

/** Group tokens under the issuer CMC names on each token. */
function byIssuer(tokens: TokenRepresentation[]) {
  const groups = new Map<string, { id: string | null; name: string; tokens: TokenRepresentation[] }>();
  for (const t of tokens) {
    const key = t.issuer?.id ?? "__none";
    if (!groups.has(key)) groups.set(key, { id: t.issuer?.id ?? null, name: t.issuer?.name ?? "Issuer not in CMC data", tokens: [] });
    groups.get(key)!.tokens.push(t);
  }
  return [...groups.values()].sort((a, b) => b.tokens.length - a.tokens.length);
}

/**
 * Underlying asset → RWA ID → issuers → tokens → chains.
 * A readable composition rather than a force graph; every node is real CMC data.
 */
export function IdentityGraph({ passport, compact = false }: { passport: Passport; compact?: boolean }) {
  const { profile, tokens, chains } = passport;
  const groups = byIssuer(tokens);
  const logo = assetLogo(profile.symbol, profile.logo);
  const chainCount = new Map<string, number>();
  tokens.forEach((t) => t.chains.forEach((c) => chainCount.set(c, (chainCount.get(c) ?? 0) + 1)));

  return (
    <figure aria-label={`Identity of ${profile.name}`} className="flex flex-col items-stretch">
      {/* Underlying asset */}
      <div className="reveal mx-auto flex items-center gap-3 rounded-full border bg-paper py-2 pr-5 pl-2" style={{ boxShadow: "var(--shadow-paper)" }}>
        {logo ? (
          <Image src={logo} alt="" width={36} height={36} className="size-9 rounded-full border bg-background object-cover" unoptimized={logo.startsWith("http")} />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-foreground font-mono text-[11px] text-background">{profile.symbol.slice(0, 2)}</span>
        )}
        <div>
          <p className="eyebrow">Underlying asset</p>
          <p className="text-sm font-medium">{profile.name}</p>
        </div>
      </div>

      <Stem delay={120} />

      {/* RWA identity seal */}
      <div className="reveal mx-auto flex flex-col items-center" style={d(220)}>
        <div className="relative grid size-24 place-items-center rounded-full border-2 border-pulse bg-paper">
          <span className="absolute inset-1.5 rounded-full border border-dashed border-pulse/50" aria-hidden />
          <div className="text-center">
            <p className="font-mono text-[9px] tracking-[0.2em] text-pulse uppercase">RWA</p>
            <p className="font-sans text-2xl font-semibold text-pulse tabular">#{profile.rwaId}</p>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{ASSET_TYPE_LABEL[profile.assetType]} · stable CMC identity</p>
      </div>

      <Stem delay={380} />

      {groups.length === 0 ? (
        <p className="reveal mx-auto rounded-xl border border-dashed px-5 py-4 text-sm text-muted-foreground" style={d(450)}>
          {profile.hasTokens === false ? "CMC reports no tokenized representations." : "No token representations in the latest CMC quote."}
        </p>
      ) : (
        <>
          <div className="draw-x mx-auto hidden h-px w-[calc(100%-8rem)] bg-foreground/30 sm:block" style={d(430)} aria-hidden />
          <div className={cn("grid gap-4 sm:gap-5", compact ? "sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]" : "sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]")}>
            {groups.slice(0, compact ? 4 : undefined).map((g, i) => (
              <div key={g.id ?? "none"} className="reveal flex flex-col" style={d(500 + i * 90)}>
                <div className="draw mx-auto hidden h-5 w-px bg-foreground/30 sm:block" style={d(480 + i * 90)} aria-hidden />
                <div className="surface flex flex-1 flex-col p-4">
                  <div className="flex items-baseline justify-between gap-2 border-b pb-2.5">
                    <p className="eyebrow">Issuer</p>
                    <span className="font-mono text-[10px] text-muted-foreground">{g.tokens.length} token{g.tokens.length === 1 ? "" : "s"}</span>
                  </div>
                  {g.id ? (
                    <Link href={`/issuers/${g.id}`} className="mt-2.5 truncate font-medium underline-offset-4 hover:underline">
                      {g.name}
                    </Link>
                  ) : (
                    <p className="mt-2.5 text-sm text-muted-foreground">{g.name}</p>
                  )}
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {g.tokens.map((t) => (
                      <li key={t.cryptoId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
                          <span className="truncate font-mono text-[12.5px]">{t.symbol ?? `#${t.cryptoId}`}</span>
                        </span>
                        <span className="truncate text-right font-mono text-[10px] text-muted-foreground">
                          {t.chains.length ? `${t.chains[0]}${t.chains.length > 1 ? ` +${t.chains.length - 1}` : ""}` : "chain n/a"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          {compact && groups.length > 4 && (
            <p className="mt-3 text-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase">+ {groups.length - 4} more issuers</p>
          )}

          <Stem delay={700} />

          {/* Chains */}
          <div className="reveal mx-auto flex max-w-3xl flex-col items-center gap-3" style={d(780)}>
            <p className="eyebrow">Chains · {chains.length}</p>
            {chains.length ? (
              <div className="flex flex-wrap justify-center gap-1.5">
                {chains.map((c) => (
                  <span key={c} className="rounded-full border bg-paper px-3 py-1 text-xs">
                    {c}
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{chainCount.get(c)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not available in CMC data</p>
            )}
          </div>
        </>
      )}
      <figcaption className="mt-8 text-center text-xs text-muted-foreground">
        Tokenized representations can share an underlying asset while differing in issuer, token and chain. Read from CMC responses; nothing inferred.
      </figcaption>
    </figure>
  );
}
