import "server-only";
import {
  DEMO_CRYPTO_INFO,
  DEMO_INFO,
  DEMO_ISSUERS,
  DEMO_QUOTES,
} from "@/lib/fixtures/demo";
import { makeReceipt } from "@/lib/receipt";
import type {
  DataMode,
  IssuerSummary,
  Passport,
  ResponseMeta,
  RwaIdentity,
  RwaListRow,
} from "@/lib/types";
import { CmcError, cmcGet, demoResult, hasCmcKey, type CmcResult } from "./cmc";
import type {
  CmcCryptoInfoData,
  CmcCryptoInfoItem,
  CmcIssuerData,
  CmcIssuerListData,
  CmcRwaInfoData,
  CmcRwaMapData,
  CmcRwaQuoteData,
} from "./cmc-types";
import {
  cryptoInfoById,
  issuerListItems,
  normalizeAggregate,
  normalizeIdentity,
  normalizeIssuer,
  normalizeListRow,
  normalizeProfile,
  normalizeTokens,
  normalizeTradfi,
  quoteCurrency,
  rankSearchResults,
} from "./normalizers";

export const RWA = {
  map: "/v5/real-world-assets/map",
  info: "/v5/real-world-assets/info",
  list: "/v5/real-world-assets/assets/list",
  quotes: "/v5/real-world-assets/quotes/latest",
  issuersList: "/v5/real-world-assets/issuers/list",
  issuer: "/v5/real-world-assets/issuers",
  cryptoInfo: "/v2/cryptocurrency/info",
} as const;

export const dataMode = (): DataMode => (hasCmcKey() ? "live" : "demo");

const TICKER = /^[0-9A-Za-z$@\-]{1,15}$/;

/* ------------------------------------------------------------------ search */

export interface SearchResult {
  mode: DataMode;
  results: RwaIdentity[];
  meta: ResponseMeta | null;
}

/** Top of the RWA ID map by rank, for name search. The map costs 0 credits. */
async function mapIndex(): Promise<RwaIdentity[]> {
  const pages = await Promise.allSettled(
    [1, 251, 501, 751].map((start) =>
      cmcGet<CmcRwaMapData>(RWA.map, { sort: "rwa_rank", start: String(start), limit: "250" }, { revalidate: 3600 })
    )
  );
  return pages.flatMap((p) => (p.status === "fulfilled" ? p.value.data.rwa_assets.map(normalizeIdentity) : []));
}

/**
 * Resolve a query to RWA identities. Ticker-like queries hit the map with
 * `symbol` first (exact, free); name queries search the cached map index.
 */
export async function searchRwa(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { mode: dataMode(), results: [], meta: null };

  if (!hasCmcKey()) {
    const res = demoResult(RWA.map, { symbol: q.toUpperCase() }, DEMO_INFO);
    return { mode: "demo", results: rankSearchResults(DEMO_INFO.map(normalizeIdentity), q), meta: res.meta };
  }

  const [exact, index] = await Promise.all([
    TICKER.test(q)
      ? cmcGet<CmcRwaMapData>(RWA.map, { symbol: q.toUpperCase() }, { revalidate: 300 }).catch((e: unknown) => {
          if (e instanceof CmcError && (e.kind === "bad_request" || e.kind === "not_found")) return null;
          throw e;
        })
      : Promise.resolve(null),
    mapIndex(),
  ]);
  const exactRows = exact?.data.rwa_assets.map(normalizeIdentity) ?? [];
  return {
    mode: "live",
    results: rankSearchResults([...exactRows, ...index], q),
    meta: exact?.meta ?? null,
  };
}

/* ---------------------------------------------------------------- issuers */

/** Issuers List (1 credit, cached 15 min) keyed by issuer_id, used to enrich issuers named on tokens. */
async function issuerDirectory(): Promise<Map<string, IssuerSummary>> {
  const { issuers } = await listIssuers();
  return new Map(issuers.map((i) => [i.id, i]));
}

export async function listIssuers(): Promise<{ mode: DataMode; issuers: IssuerSummary[]; meta: ResponseMeta }> {
  if (!hasCmcKey()) {
    const r = demoResult(RWA.issuersList, {}, DEMO_ISSUERS);
    return { mode: "demo", issuers: DEMO_ISSUERS.map(normalizeIssuer), meta: r.meta };
  }
  const r = await cmcGet<CmcIssuerListData>(RWA.issuersList, { limit: "250" }, { revalidate: 900 });
  return { mode: "live", issuers: issuerListItems(r.data).map(normalizeIssuer), meta: r.meta };
}

export async function getIssuer(issuerId: string): Promise<{ mode: DataMode; data: CmcIssuerData; meta: ResponseMeta }> {
  if (!/^[0-9a-f]{24}$/.test(issuerId)) throw new CmcError("bad_request", "Invalid issuer_id", RWA.issuer);
  if (!hasCmcKey()) {
    const found = DEMO_ISSUERS.find((i) => i.issuer_id === issuerId);
    if (!found) throw new CmcError("not_found", "Issuer not in demo data", RWA.issuer);
    const r = demoResult(RWA.issuer, { issuer_id: issuerId }, found);
    return { mode: "demo", data: found, meta: r.meta };
  }
  const r = await cmcGet<CmcIssuerData>(RWA.issuer, { issuer_id: issuerId, limit: "250" }, { revalidate: 900 });
  return { mode: "live", data: r.data, meta: r.meta };
}

/* ------------------------------------------------------------- passport */

async function fetchInfo(rwaId: number): Promise<CmcResult<CmcRwaInfoData>> {
  if (!hasCmcKey()) {
    const rows = DEMO_INFO.filter((r) => r.rwa_id === rwaId);
    if (!rows.length) throw new CmcError("not_found", "Not in demo data", RWA.info);
    return demoResult(RWA.info, { rwa_id: String(rwaId) }, { rwa_assets: rows });
  }
  return cmcGet<CmcRwaInfoData>(RWA.info, { rwa_id: String(rwaId) }, { revalidate: 900 });
}

async function fetchQuotes(rwaIds: number[], currency: string): Promise<CmcResult<CmcRwaQuoteData>> {
  const params = { rwa_id: rwaIds.join(","), convert: currency.toUpperCase() };
  if (!hasCmcKey()) {
    return demoResult(RWA.quotes, params, { rwa_assets: DEMO_QUOTES.filter((r) => rwaIds.includes(r.rwa_id)) });
  }
  return cmcGet<CmcRwaQuoteData>(RWA.quotes, { ...params, skip_invalid: "true" }, { revalidate: 60 });
}

async function fetchCryptoInfo(ids: number[]): Promise<Map<number, CmcCryptoInfoItem>> {
  if (!ids.length) return new Map();
  if (!hasCmcKey()) return new Map(DEMO_CRYPTO_INFO.filter((c) => ids.includes(c.id)).map((c) => [c.id, c]));
  const r = await cmcGet<CmcCryptoInfoData>(
    RWA.cryptoInfo,
    { id: [...ids].sort((a, b) => a - b).join(","), aux: "platform,logo", skip_invalid: "true" },
    { revalidate: 86_400 }
  );
  return cryptoInfoById(r.data);
}

/**
 * Everything the Passport page needs, in at most four CMC calls:
 * info + quotes (parallel), then crypto info (one batched call) and the
 * cached issuer index. Secondary failures degrade to warnings.
 */
export async function getPassport(rwaId: number, currency: string): Promise<Passport> {
  const [info, quotes] = await Promise.all([
    fetchInfo(rwaId),
    fetchQuotes([rwaId], currency).catch((e: unknown) => e as Error),
  ]);

  const infoItem = info.data.rwa_assets.find((a) => a.rwa_id === rwaId) ?? info.data.rwa_assets[0];
  if (!infoItem) throw new CmcError("not_found", "CMC returned no metadata for this rwa_id", RWA.info);

  const warnings: string[] = [];
  const responses: ResponseMeta[] = [info.meta];
  const profile = normalizeProfile(infoItem);
  const identityReceipt = makeReceipt(info.meta, {
    label: "RWA ID",
    field: "data.rwa_assets[0].rwa_id",
    value: infoItem.rwa_id,
    rwaId,
    identifier: { type: "rwa_id", value: String(rwaId) },
  });

  let quoteIndex = -1;
  let quoteItem = null;
  if (quotes instanceof Error) {
    warnings.push("Quote unavailable: CMC did not return market data for this asset right now.");
  } else {
    responses.push(quotes.meta);
    quoteIndex = quotes.data.rwa_assets.findIndex((a) => a.rwa_id === rwaId);
    quoteItem = quoteIndex >= 0 ? quotes.data.rwa_assets[quoteIndex] : null;
    if (!quoteItem) warnings.push("CMC returned no tokenized quote for this asset.");
  }

  const cryptoIds = (quoteItem?.tokens ?? []).map((t) => t.crypto_id).filter((id) => typeof id === "number");
  const [cryptoInfo, directory] = await Promise.all([
    fetchCryptoInfo(cryptoIds).catch(() => {
      if (cryptoIds.length) warnings.push("Chain data unavailable: /v2/cryptocurrency/info did not respond.");
      return new Map<number, CmcCryptoInfoItem>();
    }),
    issuerDirectory().catch(() => new Map<string, IssuerSummary>()),
  ]);

  const tokens =
    quoteItem && !(quotes instanceof Error)
      ? normalizeTokens(quoteItem, quotes.meta, currency, { cryptoInfo }, quoteIndex)
      : [];

  // Issuers come from tokens[].issuer_id; the directory only adds counts and websites.
  const issuers = [...new Map(tokens.flatMap((t) => (t.issuer ? [[t.issuer.id, t.issuer] as const] : []))).values()].map(
    (i) => directory.get(i.id) ?? { id: i.id, name: i.name, numTokens: null, active: null, website: null }
  );

  return {
    mode: info.meta.mode,
    currency: quoteItem ? quoteCurrency(quoteItem, currency) : currency.toUpperCase(),
    profile,
    identityReceipt,
    aggregate: quoteItem && !(quotes instanceof Error) ? normalizeAggregate(quoteItem, quotes.meta, currency, quoteIndex) : null,
    tokens,
    tradfi: normalizeTradfi(quoteItem?.tradfi_markets),
    issuers,
    chains: [...new Set(tokens.flatMap((t) => t.chains))],
    warnings,
    responses,
  };
}

/* ----------------------------------------------------------------- lists */

export async function listRwas(opts: { currency: string; assetType?: string; limit?: number }): Promise<{
  mode: DataMode;
  rows: RwaListRow[];
  currency: string;
  meta: ResponseMeta;
}> {
  const params = {
    convert: opts.currency.toUpperCase(),
    asset_type: opts.assetType,
    limit: String(opts.limit ?? 100),
    sort: "rwa_rank",
  };
  if (!hasCmcKey()) {
    const rows = DEMO_QUOTES.filter((r) => !opts.assetType || r.asset_type === opts.assetType);
    const r = demoResult(RWA.list, params as Record<string, string>, { rwa_assets: rows });
    return { mode: "demo", rows: rows.map((x) => normalizeListRow(x, opts.currency)), currency: "USD", meta: r.meta };
  }
  const r = await cmcGet<CmcRwaQuoteData>(RWA.list, params, { revalidate: 60 });
  const first = r.data.rwa_assets[0];
  return {
    mode: "live",
    rows: r.data.rwa_assets.map((x) => normalizeListRow(x, opts.currency)),
    currency: first ? quoteCurrency(first, opts.currency) : opts.currency.toUpperCase(),
    meta: r.meta,
  };
}

/** Snapshot quotes for many saved assets in one call. */
export async function quoteSnapshots(rwaIds: number[], currency: string) {
  const r = await fetchQuotes(rwaIds, currency);
  return {
    mode: r.meta.mode,
    rows: r.data.rwa_assets.map((x) => normalizeListRow(x, currency)),
    currency: r.data.rwa_assets[0] ? quoteCurrency(r.data.rwa_assets[0], currency) : currency.toUpperCase(),
    meta: r.meta,
  };
}

/** Metadata only (one call), for /api/rwa/info. */
export async function getProfile(rwaId: number) {
  const info = await fetchInfo(rwaId);
  const item = info.data.rwa_assets.find((a) => a.rwa_id === rwaId);
  if (!item) throw new CmcError("not_found", "CMC returned no metadata for this rwa_id", RWA.info);
  return { mode: info.meta.mode, profile: normalizeProfile(item), meta: info.meta };
}
