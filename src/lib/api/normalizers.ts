/**
 * Pure functions: raw CMC payloads → stable internal types.
 * No I/O here, so everything is unit-tested in tests/normalizers.test.ts.
 */
import { makeReceipt } from "@/lib/receipt";
import type {
  AggregateQuote,
  AssetType,
  IssuerSummary,
  ResponseMeta,
  RwaIdentity,
  RwaListRow,
  RwaProfile,
  TokenRepresentation,
  TradfiMarket,
} from "@/lib/types";
import type {
  CmcCryptoInfoData,
  CmcCryptoInfoItem,
  CmcIssuerListData,
  CmcIssuerListItem,
  CmcRwaInfoItem,
  CmcRwaMapItem,
  CmcRwaConvertedQuote,
  CmcRwaQuoteBlock,
  CmcRwaQuoteItem,
  CmcTradfiMarket,
} from "./cmc-types";

const ASSET_TYPES: AssetType[] = ["stock", "commodity", "currency", "government_security", "etf", "real_estate"];

export function normalizeAssetType(raw: string | null | undefined): AssetType {
  const t = (raw ?? "").toLowerCase() as AssetType;
  return ASSET_TYPES.includes(t) ? t : "unknown";
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

export function normalizeIdentity(raw: CmcRwaMapItem): RwaIdentity {
  return {
    rwaId: raw.rwa_id,
    name: str(raw.name) ?? raw.symbol,
    symbol: raw.symbol,
    slug: str(raw.slug),
    assetType: normalizeAssetType(raw.asset_type),
    rank: num(raw.rwa_rank),
    hasTokens: typeof raw.has_tokens === "boolean" ? raw.has_tokens : null,
  };
}

function formatFounded(v: string): string {
  // CMC returns ISO 8601; show the year unless it is something else entirely.
  const m = /^(\d{4})/.exec(v);
  return m ? m[1] : v;
}

/** Profile with only the company facts CMC actually returned. */
export function normalizeProfile(raw: CmcRwaInfoItem): RwaProfile {
  const facts: { label: string; value: string }[] = [];
  const industry = str(raw.industry);
  const founded = str(raw.founded);
  const employees = num(raw.employees);
  const exchange = str(raw.primary_exchange);
  const cik = raw.cik != null ? str(String(raw.cik)) : null;
  if (industry) facts.push({ label: "Industry", value: industry });
  if (founded) facts.push({ label: "Founded", value: formatFounded(founded) });
  if (employees != null) facts.push({ label: "Employees", value: employees.toLocaleString("en-US") });
  if (exchange) facts.push({ label: "Primary exchange", value: exchange });
  if (cik) facts.push({ label: "SEC CIK", value: cik });
  return {
    ...normalizeIdentity(raw),
    description: str(raw.about?.description),
    logo: str(raw.about?.logo),
    website: str(raw.about?.website) ?? str(raw.website),
    facts,
  };
}

/**
 * Pick the quote block for a currency. Live CMC responses put converted
 * aggregates in `quotes[]` (one entry per `convert` symbol) while the flat
 * fields stay in USD. `quote[CUR]` is accepted too, per the reference wording.
 */
export function pickQuote(
  item: { quotes?: CmcRwaConvertedQuote[]; quote?: Record<string, CmcRwaQuoteBlock> } & CmcRwaQuoteBlock,
  currency: string
): { block: CmcRwaQuoteBlock; currency: string; path: string } {
  const cur = currency.toUpperCase();
  const i = item.quotes?.findIndex((q) => q.symbol?.toUpperCase() === cur) ?? -1;
  if (item.quotes && i >= 0) return { block: item.quotes[i], currency: cur, path: `quotes[${i}].` };
  const nested = item.quote?.[cur];
  if (nested) return { block: nested, currency: cur, path: `quote.${cur}.` };
  return { block: item, currency: "USD", path: "" };
}

export function quoteCurrency(item: CmcRwaQuoteItem, currency: string): string {
  return pickQuote(item, currency).currency;
}

export function normalizeAggregate(
  item: CmcRwaQuoteItem,
  meta: ResponseMeta,
  currency: string,
  index = 0
): AggregateQuote {
  const { block, path } = pickQuote(item, currency);
  const base = `data.rwa_assets[${index}].${path}`;
  const ts = str(block.last_updated) ?? undefined;
  const identifier = { type: "rwa_id", value: String(item.rwa_id) };
  const r = (label: string, field: keyof CmcRwaQuoteBlock) =>
    makeReceipt(meta, { label, field: base + field, value: block[field], rwaId: item.rwa_id, identifier, sourceTimestamp: ts });
  return {
    averageTokenizedPrice: num(block.average_tokenized_price),
    tokenizedMarketCap: num(block.tokenized_market_cap),
    tokenizedVolume24h: num(block.tokenized_volume_24h),
    lastUpdated: ts ?? null,
    receipts: {
      averageTokenizedPrice: r("Average tokenized price", "average_tokenized_price"),
      tokenizedMarketCap: r("Tokenized market cap", "tokenized_market_cap"),
      tokenizedVolume24h: r("Tokenized 24h volume", "tokenized_volume_24h"),
    },
  };
}

/** Chain names from /v2/cryptocurrency/info, de-duplicated, in CMC order. */
export function chainsFromCryptoInfo(item: CmcCryptoInfoItem | undefined): string[] {
  if (!item) return [];
  const names = [
    item.platform?.name,
    ...(item.contract_address ?? []).map((c) => c.platform?.name ?? c.platform?.coin?.name),
  ].filter((n): n is string => typeof n === "string" && n.trim() !== "");
  return [...new Set(names)];
}

/** /v2/cryptocurrency/info keys data by id; values may be an object or a one-item array. */
export function cryptoInfoById(data: CmcCryptoInfoData): Map<number, CmcCryptoInfoItem> {
  const out = new Map<number, CmcCryptoInfoItem>();
  for (const v of Object.values(data)) {
    const item = Array.isArray(v) ? v[0] : v;
    if (item && typeof item.id === "number") out.set(item.id, item);
  }
  return out;
}

export function normalizeTokens(
  item: CmcRwaQuoteItem,
  meta: ResponseMeta,
  currency: string,
  lookups: { cryptoInfo?: Map<number, CmcCryptoInfoItem> } = {},
  index = 0
): TokenRepresentation[] {
  return (item.tokens ?? [])
    .filter((t) => typeof t.crypto_id === "number")
    .map((t, i) => {
      const { block, path, currency: cur } = pickQuote(t, currency);
      const info = lookups.cryptoInfo?.get(t.crypto_id);
      const price = num(block.price);
      const issuerId = str(t.issuer_id);
      return {
        cryptoId: t.crypto_id,
        name: str(t.name),
        symbol: str(t.symbol),
        price,
        marketCap: num(block.market_cap),
        volume24h: num(block.volume_24h),
        currency: cur,
        issuer: issuerId ? { id: issuerId, name: str(t.issuer_name) ?? issuerId } : null,
        chains: chainsFromCryptoInfo(info),
        logo: str(info?.logo),
        priceReceipt: makeReceipt(meta, {
          label: `${str(t.symbol) ?? "Token"} price`,
          field: `data.rwa_assets[${index}].tokens[${i}].${path}price`,
          value: price,
          rwaId: item.rwa_id,
          identifier: { type: "crypto_id", value: String(t.crypto_id) },
          sourceTimestamp: str(block.last_updated),
        }),
      };
    });
}

export function normalizeTradfi(markets: CmcTradfiMarket[] | undefined): TradfiMarket[] {
  return (markets ?? []).map((m) => ({
    venue:
      str(m.exchange_name) ??
      (typeof m.exchange === "object" && m.exchange ? str(m.exchange.name) : str(m.exchange)) ??
      str(m.name),
    ticker: str(m.ticker) ?? str(m.symbol),
    url: str(m.market_url),
    price: num(m.price),
    currency: str(m.currency),
  }));
}

export function issuerListItems(data: CmcIssuerListData): CmcIssuerListItem[] {
  return Array.isArray(data) ? data : (data.issuers ?? []);
}

export function normalizeIssuer(raw: CmcIssuerListItem): IssuerSummary {
  return {
    id: raw.issuer_id,
    name: str(raw.name) ?? raw.issuer_id,
    numTokens: num(raw.num_tokens),
    active: typeof raw.active === "boolean" ? raw.active : null,
    website: str(raw.website),
  };
}

export function normalizeListRow(item: CmcRwaQuoteItem, currency: string): RwaListRow {
  const { block } = pickQuote(item, currency);
  return {
    ...normalizeIdentity(item),
    averageTokenizedPrice: num(block.average_tokenized_price),
    tokenizedMarketCap: num(block.tokenized_market_cap),
    tokenizedVolume24h: num(block.tokenized_volume_24h),
    tokenCount: Array.isArray(item.tokens) ? item.tokens.length : null,
  };
}

/**
 * Rank RWA map rows for a search query: exact symbol, then symbol prefix,
 * then name/slug match. Ties break on rwa_rank.
 */
export function rankSearchResults(items: RwaIdentity[], query: string, limit = 8): RwaIdentity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const score = (a: RwaIdentity): number => {
    const sym = a.symbol.toLowerCase();
    const name = a.name.toLowerCase();
    if (sym === q) return 0;
    if (sym.startsWith(q)) return 1;
    if (name.startsWith(q)) return 2;
    if (name.includes(q) || (a.slug ?? "").includes(q.replace(/\s+/g, "-"))) return 3;
    return -1;
  };
  const seen = new Set<number>();
  return items
    .map((a) => ({ a, s: score(a) }))
    .filter(({ a, s }) => s >= 0 && !seen.has(a.rwaId) && seen.add(a.rwaId))
    .sort((x, y) => x.s - y.s || (x.a.rank ?? 1e9) - (y.a.rank ?? 1e9))
    .slice(0, limit)
    .map(({ a }) => a);
}
