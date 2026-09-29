import Image from "next/image";
import Link from "next/link";
import { TruthReceipt } from "@/components/receipt/truth-receipt";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { TokenRepresentation } from "@/lib/types";

const NA = <span className="text-muted-foreground">Not in CMC data</span>;

export function TokenCard({ token }: { token: TokenRepresentation }) {
  const price = formatMoney(token.price, token.currency);
  return (
    <article className="surface group flex flex-col gap-5 p-5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-editorial)] hover:-translate-y-0.5 hover:[box-shadow:var(--shadow-lift)]">
      <div className="flex items-start gap-3">
        {token.logo ? (
          <Image src={token.logo} alt="" width={36} height={36} className="size-9 rounded-full border bg-background" unoptimized />
        ) : (
          <span className="grid size-9 place-items-center rounded-full border font-mono text-[10px]">{token.symbol?.slice(0, 3) ?? "—"}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[15px] font-medium">{token.symbol ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{token.name ?? "Unnamed token"}</p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">#{token.cryptoId}</span>
      </div>
      {token.priceReceipt ? (
        <TruthReceipt receipt={token.priceReceipt} display={price}>
          <span className="font-sans text-2xl font-semibold tracking-tight tabular">{price}</span>
        </TruthReceipt>
      ) : (
        <span className="text-2xl font-semibold">{price}</span>
      )}
      <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 border-t border-dotted pt-3 text-[13px]">
        <dt className="eyebrow pt-0.5">Issuer</dt>
        <dd className="min-w-0 truncate">
          {token.issuer ? (
            <Link href={`/issuers/${token.issuer.id}`} className="underline-offset-4 hover:underline">
              {token.issuer.name}
            </Link>
          ) : (
            NA
          )}
        </dd>
        <dt className="eyebrow pt-0.5">Chains</dt>
        <dd className="min-w-0">{token.chains.length ? token.chains.join(", ") : NA}</dd>
        <dt className="eyebrow pt-0.5">Mkt cap</dt>
        <dd className="tabular">{token.marketCap != null ? formatCompactMoney(token.marketCap, token.currency) : NA}</dd>
      </dl>
    </article>
  );
}
