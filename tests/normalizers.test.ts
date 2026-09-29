import { describe, expect, it } from "vitest";
import {
  chainsFromCryptoInfo,
  cryptoInfoById,
  issuerListItems,
  normalizeAggregate,
  normalizeIdentity,
  normalizeProfile,
  normalizeTokens,
  normalizeTradfi,
  pickQuote,
  rankSearchResults,
} from "@/lib/api/normalizers";
import type { CmcRwaQuoteItem } from "@/lib/api/cmc-types";
import type { ResponseMeta } from "@/lib/types";

const meta: ResponseMeta = {
  endpoint: "/v5/real-world-assets/quotes/latest",
  params: { rwa_id: "1" },
  retrievedAt: "2026-09-29T00:00:00Z",
  responseHash: "h",
  mode: "live",
};

// Mirrors the documented Quotes Latest example for GOLD.
const gold: CmcRwaQuoteItem = {
  name: "GOLD", symbol: "GOLD", slug: "gold", rwa_id: 1, asset_type: "commodity", rwa_rank: 1, has_tokens: true,
  average_tokenized_price: 4018.181479970762,
  tokenized_market_cap: 1884879975.1722481,
  tokenized_volume_24h: 139285845.1274847,
  tokens: [
    { symbol: "PAXG", name: "PAX Gold", price: 4024.36, crypto_id: 4705, market_cap: 1806493532.83 },
    { symbol: "XAUM", name: "Matrixdock Gold", price: 4030.17, crypto_id: 34212, market_cap: 45234553.51 },
  ],
  tradfi_markets: [],
};

describe("RWA identity", () => {
  it("normalizes the documented map row", () => {
    const id = normalizeIdentity({ name: "SpaceX", symbol: "SPCX", slug: "spacex", rwa_id: 9, asset_type: "stock", rwa_rank: 7, has_tokens: true });
    expect(id).toEqual({ rwaId: 9, name: "SpaceX", symbol: "SPCX", slug: "spacex", assetType: "stock", rank: 7, hasTokens: true });
  });

  it("tolerates missing and unknown fields", () => {
    const id = normalizeIdentity({ rwa_id: 5, name: "", symbol: "X", asset_type: "weird" });
    expect(id).toMatchObject({ name: "X", slug: null, assetType: "unknown", rank: null, hasTokens: null });
  });
});

describe("profile", () => {
  it("only lists facts CMC returned", () => {
    const p = normalizeProfile({
      rwa_id: 1, name: "GOLD", symbol: "GOLD", asset_type: "commodity",
      industry: null, founded: null, employees: null, primary_exchange: null, cik: null, about: null,
    });
    expect(p.facts).toEqual([]);
    expect(p.description).toBeNull();
    expect(p.website).toBeNull();
  });

  it("renders stock facts", () => {
    const p = normalizeProfile({
      rwa_id: 9, name: "SpaceX", symbol: "SPCX", asset_type: "stock",
      founded: "2002-03-14T00:00:00Z", employees: 13000, primary_exchange: "NASDAQ", cik: "0001181412",
      about: { description: "Rockets", logo: "https://s2.coinmarketcap.com/x.png", website: "https://spacex.com" },
    });
    expect(p.facts.map((f) => f.label)).toEqual(["Founded", "Employees", "Primary exchange", "SEC CIK"]);
    expect(p.facts[0].value).toBe("2002");
    expect(p.facts[1].value).toBe("13,000");
  });
});

describe("quotes", () => {
  it("reads flat documented fields as USD", () => {
    const { currency, path } = pickQuote(gold, "usd");
    expect(currency).toBe("USD");
    expect(path).toBe("");
    const agg = normalizeAggregate(gold, meta, "usd");
    expect(agg.averageTokenizedPrice).toBeCloseTo(4018.18, 2);
    expect(agg.receipts.tokenizedMarketCap.field).toBe("data.rwa_assets[0].tokenized_market_cap");
    expect(agg.receipts.averageTokenizedPrice.verificationStatus).toBe("verified");
  });

  it("uses the live quotes[] array for converted aggregates", () => {
    const item: CmcRwaQuoteItem = {
      ...gold,
      quotes: [{ symbol: "EUR", crypto_id: 2790, average_tokenized_price: 3550.1, tokenized_market_cap: 4.1e9, tokenized_volume_24h: 4e8, last_updated: "2026-09-29T15:22:59.000Z" }],
    };
    const agg = normalizeAggregate(item, meta, "eur");
    expect(agg.averageTokenizedPrice).toBe(3550.1);
    expect(agg.receipts.averageTokenizedPrice.field).toBe("data.rwa_assets[0].quotes[0].average_tokenized_price");
    expect(pickQuote(item, "usd").currency).toBe("USD");
    expect(pickQuote(item, "usd").block.average_tokenized_price).toBeCloseTo(4018.18, 2);
  });

  it("uses quote[CUR] when convert returned it", () => {
    const item: CmcRwaQuoteItem = { ...gold, quote: { EUR: { average_tokenized_price: 3700, last_updated: "2026-09-29T01:00:00Z" } } };
    const agg = normalizeAggregate(item, meta, "eur", 2);
    expect(agg.averageTokenizedPrice).toBe(3700);
    expect(agg.tokenizedMarketCap).toBeNull();
    expect(agg.receipts.tokenizedMarketCap.verificationStatus).toBe("unavailable");
    expect(agg.receipts.averageTokenizedPrice.field).toBe("data.rwa_assets[2].quote.EUR.average_tokenized_price");
    expect(agg.lastUpdated).toBe("2026-09-29T01:00:00Z");
  });

  it("falls back to USD when the requested currency is absent", () => {
    expect(pickQuote(gold, "inr").currency).toBe("USD");
  });
});

describe("token representations", () => {
  it("reads issuer from the token and joins chains by crypto_id without inventing either", () => {
    const withIssuer: CmcRwaQuoteItem = {
      ...gold,
      tokens: [{ ...gold.tokens![0], issuer_id: "68904c24abae9b5b9fb35815", issuer_name: "Paxos" }, gold.tokens![1]],
    };
    const tokens = normalizeTokens(withIssuer, meta, "eur", {
      cryptoInfo: new Map([[4705, { id: 4705, name: "PAX Gold", symbol: "PAXG", platform: { name: "Ethereum" } }]]),
    });
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({ cryptoId: 4705, issuer: { id: "68904c24abae9b5b9fb35815", name: "Paxos" }, chains: ["Ethereum"], price: 4024.36 });
    // Token prices are USD in live responses even when convert=EUR.
    expect(tokens[0].currency).toBe("USD");
    expect(tokens[1]).toMatchObject({ cryptoId: 34212, issuer: null, chains: [] });
    expect(tokens[1].priceReceipt?.identifier).toEqual({ type: "crypto_id", value: "34212" });
  });

  it("handles an asset with no tokens", () => {
    expect(normalizeTokens({ ...gold, tokens: undefined }, meta, "usd")).toEqual([]);
  });

  it("dedupes chains across platform and contract addresses", () => {
    expect(
      chainsFromCryptoInfo({
        id: 1, name: "t", symbol: "T",
        platform: { name: "Ethereum" },
        contract_address: [{ contract_address: "0x", platform: { name: "Ethereum" } }, { contract_address: "0y", platform: { name: "Solana" } }],
      })
    ).toEqual(["Ethereum", "Solana"]);
    expect(chainsFromCryptoInfo(undefined)).toEqual([]);
  });

  it("accepts object or array values in /v2/cryptocurrency/info", () => {
    const m = cryptoInfoById({ "1": { id: 1, name: "a", symbol: "A" }, "2": [{ id: 2, name: "b", symbol: "B" }] });
    expect([...m.keys()]).toEqual([1, 2]);
  });
});

describe("misc shapes", () => {
  it("normalizes tradfi rows with partial fields", () => {
    expect(
      normalizeTradfi([
        { exchange: { slug: "binance", name: "Binance", exchange_id: 270 }, ticker: "TSLA", market_url: "https://www.binance.com/en/stocks/EQ_TSLA" },
        { exchange: "NASDAQ", symbol: "SPCX", price: 230 },
        {},
      ])
    ).toEqual([
      { venue: "Binance", ticker: "TSLA", url: "https://www.binance.com/en/stocks/EQ_TSLA", price: null, currency: null },
      { venue: "NASDAQ", ticker: "SPCX", url: null, price: 230, currency: null },
      { venue: null, ticker: null, url: null, price: null, currency: null },
    ]);
    expect(normalizeTradfi(undefined)).toEqual([]);
  });

  it("reads issuers list as object or array", () => {
    const row = { issuer_id: "6a2d54b697c45356b1a634f4", name: "Backpack", num_tokens: 1 };
    expect(issuerListItems({ issuers: [row] })).toEqual([row]);
    expect(issuerListItems([row])).toEqual([row]);
  });
});

describe("search ranking (RWA ID resolution)", () => {
  const rows = [
    { rwaId: 3, name: "Tesla Inc", symbol: "TSLA", slug: "tesla", assetType: "stock" as const, rank: 3, hasTokens: true },
    { rwaId: 40, name: "TSLA Leveraged", symbol: "TSLAL", slug: "tsla-l", assetType: "etf" as const, rank: 40, hasTokens: true },
    { rwaId: 12, name: "US Treasury Bill", symbol: "TBILL", slug: "us-treasury-bill", assetType: "government_security" as const, rank: 12, hasTokens: true },
  ];
  it("puts the exact symbol first", () => {
    expect(rankSearchResults(rows, "tsla").map((r) => r.rwaId)).toEqual([3, 40]);
  });
  it("matches names and slugs", () => {
    expect(rankSearchResults(rows, "US Treasury")[0].rwaId).toBe(12);
    expect(rankSearchResults(rows, "tesla")[0].rwaId).toBe(3);
  });
  it("dedupes and handles empty queries", () => {
    expect(rankSearchResults([...rows, rows[0]], "TSLA").filter((r) => r.rwaId === 3)).toHaveLength(1);
    expect(rankSearchResults(rows, "  ")).toEqual([]);
    expect(rankSearchResults(rows, "zzzz")).toEqual([]);
  });
});
