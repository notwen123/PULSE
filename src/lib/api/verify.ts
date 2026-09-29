import "server-only";
import type { EvidenceReceipt } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { isCurrency } from "@/lib/currency";
import { CmcError } from "./cmc";
import { getDailyPulse } from "./global";
import { getPassport, searchRwa } from "./rwa";

export const VERIFY_QUERIES = ["rwa-identity", "rwa-quote", "fear-and-greed", "altcoin-season", "btc-dominance"] as const;
export type VerifyQuery = (typeof VERIFY_QUERIES)[number];

/** The public JSON shape of /api/verify, shared with the landing page example. */
export function toVerifyJson(query: VerifyQuery, answer: string, receipt: EvidenceReceipt) {
  return {
    query,
    answer,
    value: receipt.value,
    source: receipt.source,
    endpoint: receipt.endpoint,
    params: receipt.params,
    field: receipt.field,
    identifier: receipt.identifier ?? null,
    retrievedAt: receipt.retrievedAt,
    cmcTimestamp: receipt.sourceTimestamp ?? null,
    responseHash: receipt.responseHash,
    creditCount: receipt.creditCount ?? null,
    verificationStatus: receipt.verificationStatus,
    mode: receipt.mode,
  };
}

export interface VerifyAnswer {
  query: VerifyQuery;
  answer: string;
  receipt: EvidenceReceipt;
}

async function resolveRwaId(params: URLSearchParams): Promise<number> {
  const raw = params.get("rwa_id");
  if (raw) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new CmcError("bad_request", "rwa_id must be a positive integer", "/api/verify");
    return id;
  }
  const symbol = params.get("symbol");
  if (!symbol) throw new CmcError("bad_request", "Pass rwa_id or symbol", "/api/verify");
  const { results } = await searchRwa(symbol);
  const hit = results.find((r) => r.symbol.toUpperCase() === symbol.toUpperCase()) ?? results[0];
  if (!hit) throw new CmcError("not_found", `No RWA found for symbol ${symbol}`, "/v5/real-world-assets/map");
  return hit.rwaId;
}

/** Answer one structured verification query from the PULSE evidence layer. */
export async function verify(query: VerifyQuery, params: URLSearchParams): Promise<VerifyAnswer> {
  const currency = params.get("convert")?.toLowerCase() ?? "usd";
  const cur = isCurrency(currency) ? currency : "usd";

  if (query === "rwa-identity" || query === "rwa-quote") {
    const rwaId = await resolveRwaId(params);
    const p = await getPassport(rwaId, cur);
    if (query === "rwa-identity") {
      return {
        query,
        answer: `${p.profile.name} (${p.profile.symbol}) resolves to RWA ID ${p.profile.rwaId}, asset type ${p.profile.assetType}, with ${p.tokens.length} tracked token representation(s).`,
        receipt: p.identityReceipt,
      };
    }
    if (!p.aggregate) throw new CmcError("not_found", "No tokenized quote returned for this asset", "/v5/real-world-assets/quotes/latest");
    const r = p.aggregate.receipts.averageTokenizedPrice;
    return {
      query,
      answer: `Average tokenized price of ${p.profile.symbol}: ${formatMoney(p.aggregate.averageTokenizedPrice, p.currency)} (aggregate across tracked tokens).`,
      receipt: r,
    };
  }

  const pulse = await getDailyPulse(cur);
  if (query === "fear-and-greed" && pulse.fearGreed) {
    return {
      query,
      answer: `CMC Fear & Greed Index: ${pulse.fearGreed.value}${pulse.fearGreed.classification ? ` (${pulse.fearGreed.classification})` : ""}.`,
      receipt: pulse.fearGreed.receipt,
    };
  }
  if (query === "altcoin-season" && pulse.altcoinSeason) {
    return { query, answer: `CMC Altcoin Season Index: ${pulse.altcoinSeason.value} / 100.`, receipt: pulse.altcoinSeason.receipt };
  }
  if (query === "btc-dominance" && pulse.global?.btcDominance != null) {
    return { query, answer: `BTC dominance: ${pulse.global.btcDominance.toFixed(2)}%.`, receipt: pulse.global.receipts.btcDominance };
  }
  throw new CmcError("unavailable", pulse.errors.join("; ") || "Value not returned by CMC", "/api/verify");
}
