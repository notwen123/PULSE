import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CmcError, describeCmcError } from "@/lib/api/cmc";
import { getIssuer } from "@/lib/api/rwa";
import { formatUtcTime, shortHash } from "@/lib/format";
import { DataModeBadge } from "@/components/data-mode-badge";
import { ErrorState } from "@/components/state/error-state";

export const metadata: Metadata = { title: "Issuer" };

type Props = { params: Promise<{ issuerId: string }> };

export default async function IssuerPage({ params }: Props) {
  const { issuerId } = await params;
  const result = await getIssuer(issuerId).catch((e: unknown) => e as Error);
  if (result instanceof CmcError && (result.kind === "not_found" || result.kind === "bad_request")) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/issuers" className="hover:text-foreground">Issuers</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-xs">{issuerId}</span>
      </div>
      {result instanceof Error ? (
        <ErrorState {...describeCmcError(result)} />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Issuer</p>
              <h1 className="mt-2 display text-5xl sm:text-6xl">{result.data.name}</h1>
              <p className="mt-2 text-muted-foreground">{result.data.tokens?.length ?? 0} linked token(s) returned by /v5/real-world-assets/issuers</p>
            </div>
            <DataModeBadge mode={result.mode} />
          </div>
          <div className="overflow-hidden rounded-2xl border bg-paper">
            {(result.data.tokens ?? []).map((t) => (
              <div key={t.crypto_id} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium">{t.symbol ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.name ?? "Unnamed token"} · crypto_id {t.crypto_id}</p>
                </div>
                {typeof t.rwa_id === "number" ? (
                  <Link href={`/passport/${t.rwa_id}`} className="rounded-full border px-3 py-1 font-mono text-xs transition-colors hover:bg-muted">
                    Passport · rwa_id {t.rwa_id}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">No rwa_id returned</span>
                )}
              </div>
            ))}
            {!result.data.tokens?.length && <p className="p-5 text-sm text-muted-foreground">No linked tokens returned.</p>}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Retrieved {formatUtcTime(result.meta.retrievedAt)} · {result.meta.creditCount ?? "n/a"} credit(s) · sha256 {shortHash(result.meta.responseHash)}
          </p>
        </>
      )}
    </div>
  );
}
