import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { describeCmcError } from "@/lib/api/cmc";
import { listIssuers } from "@/lib/api/rwa";
import { DataModeBadge } from "@/components/data-mode-badge";
import { ErrorState } from "@/components/state/error-state";

export const metadata: Metadata = { title: "Issuers" };

export default async function IssuersPage() {
  const result = await listIssuers().catch((e: unknown) => e as Error);
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore</p>
          <h1 className="mt-2 display text-5xl sm:text-6xl">Token issuers</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">The organisations CMC tracks as minting tokenized RWAs, from /v5/real-world-assets/issuers/list.</p>
        </div>
        {!(result instanceof Error) && <DataModeBadge mode={result.mode} />}
      </div>
      {result instanceof Error ? (
        <ErrorState {...describeCmcError(result)} />
      ) : result.issuers.length === 0 ? (
        <p className="surface p-6 text-sm text-muted-foreground">CMC returned no issuers.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.issuers.map((i) => (
            <Link key={i.id} href={`/issuers/${i.id}`} className="surface group flex items-center justify-between gap-3 p-5 transition-colors hover:border-foreground/25">
              <div className="min-w-0">
                <p className="truncate font-medium">{i.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {i.numTokens != null ? `${i.numTokens} linked token${i.numTokens === 1 ? "" : "s"}` : "Token count not reported"}
                  {i.active === false && " · inactive"}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
