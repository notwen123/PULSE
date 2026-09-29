import { formatMoney, ASSET_TYPE_LABEL, formatUtcTime } from "./format";
import type { Passport } from "./types";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Deterministic plain-English explanation built only from fields present in
 * the Passport. No inference, no recommendations.
 */
export function explainPassport(p: Passport): string[] {
  const { profile, tokens, issuers, chains, aggregate, tradfi } = p;
  const type = ASSET_TYPE_LABEL[profile.assetType].toLowerCase();
  const lines: string[] = [];

  lines.push(
    `${profile.name} (${profile.symbol}) is a ${type} tracked by CoinMarketCap as a real-world asset with RWA ID ${profile.rwaId}` +
      (profile.rank != null ? `, ranked #${profile.rank} among tracked RWAs.` : ".")
  );

  if (tokens.length === 0) {
    lines.push(
      profile.hasTokens === false
        ? "CMC reports no tokenized representations for this asset."
        : "CMC did not return any token representations for this asset in the latest quote."
    );
  } else {
    let s = `CMC currently tracks ${plural(tokens.length, "tokenized representation")} of this asset`;
    if (issuers.length) s += ` from ${plural(issuers.length, "issuer")} (${issuers.map((i) => i.name).join(", ")})`;
    if (chains.length) s += ` across ${plural(chains.length, "chain")} (${chains.join(", ")})`;
    lines.push(`${s}.`);
    lines.push("Each token is a separate on-chain instrument with its own crypto_id, issuer and price; they share this RWA as their underlying asset.");
  }

  if (aggregate?.averageTokenizedPrice != null) {
    lines.push(
      `The average tokenized price across those tokens is ${formatMoney(aggregate.averageTokenizedPrice, p.currency)}` +
        (aggregate.lastUpdated ? ` as of ${formatUtcTime(aggregate.lastUpdated)}` : " at the latest CMC update") +
        ". This is an aggregate, not the price of any single token."
    );
  } else {
    lines.push("No aggregate tokenized quote was available in the latest CMC response.");
  }

  const ref = tradfi.find((t) => t.price != null);
  if (ref) {
    lines.push(
      `CMC also lists a TradFi reference${ref.venue ? ` on ${ref.venue}` : ""} at ${formatMoney(ref.price, ref.currency ?? p.currency)}.`
    );
  }

  lines.push("This summary describes data only. It is not investment advice.");
  return lines;
}
