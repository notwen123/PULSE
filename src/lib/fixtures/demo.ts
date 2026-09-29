/**
 * DEMO DATA — NOT LIVE.
 *
 * Used only when CMC_API_KEY is not configured, so the UI can render during
 * development. Every screen fed by these fixtures shows a "DEMO DATA" badge and
 * receipts carry verificationStatus "demo", never "verified".
 *
 * rwa_ids for GOLD (1), NVDA (2), SPCX (9) and TSLA (14) match live CMC; the
 * GOLD and SPCX tokens mirror CoinMarketCap's own documentation examples. The other
 * records and all crypto_ids ≥ 900000 are placeholders invented for layout.
 * With a key configured, PULSE shows real CMC responses instead.
 */
import type {
  CmcCryptoInfoItem,
  CmcIssuerData,
  CmcRwaInfoItem,
  CmcRwaQuoteItem,
} from "@/lib/api/cmc-types";

export const DEMO_INFO: CmcRwaInfoItem[] = [
  {
    rwa_id: 1, name: "GOLD", symbol: "GOLD", slug: "gold", asset_type: "commodity", rwa_rank: 1, has_tokens: true,
    industry: null, founded: null, employees: null, primary_exchange: null, cik: null,
    about: { description: "Physical gold, represented on-chain by several issuer-backed tokens.", logo: null, website: null },
  },
  {
    rwa_id: 2, name: "Nvidia Corp", symbol: "NVDA", slug: "nvidia", asset_type: "stock", rwa_rank: 2, has_tokens: true,
    industry: "Semiconductors", founded: "1993-04-05", employees: null, primary_exchange: "NASDAQ", cik: null,
    about: { description: "Designer of GPUs and accelerated-computing platforms.", logo: null, website: "https://www.nvidia.com" },
  },
  {
    rwa_id: 14, name: "Tesla Inc", symbol: "TSLA", slug: "tesla", asset_type: "stock", rwa_rank: 3, has_tokens: true,
    industry: "Automobiles", founded: "2003-07-01", employees: null, primary_exchange: "NASDAQ", cik: null,
    about: { description: "Electric vehicle and energy company.", logo: null, website: "https://www.tesla.com" },
  },
  {
    rwa_id: 9, name: "SpaceX", symbol: "SPCX", slug: "spacex", asset_type: "stock", rwa_rank: 7, has_tokens: true,
    industry: "Aerospace", founded: "2002-03-14", employees: null, primary_exchange: "NASDAQ", cik: null,
    about: { description: "Space launch and satellite communications company.", logo: null, website: "https://www.spacex.com" },
  },
  {
    rwa_id: 12, name: "US Treasury Bill", symbol: "TBILL", slug: "us-treasury-bill", asset_type: "government_security", rwa_rank: 12, has_tokens: true,
    industry: null, founded: null, employees: null, primary_exchange: null, cik: null,
    about: { description: "Short-term US government debt, represented by tokenized fund shares.", logo: null, website: null },
  },
];

const q = (avg: number, mcap: number, vol: number) => ({
  average_tokenized_price: avg,
  tokenized_market_cap: mcap,
  tokenized_volume_24h: vol,
});

export const DEMO_QUOTES: CmcRwaQuoteItem[] = [
  {
    ...DEMO_INFO[0], ...q(4018.181479970762, 1884879975.1722481, 139285845.1274847),
    tokens: [
      { symbol: "PAXG", name: "PAX Gold", price: 4024.36, crypto_id: 4705, market_cap: 1806493532.83 },
      { symbol: "XAUM", name: "Matrixdock Gold", price: 4030.17, crypto_id: 34212, market_cap: 45234553.51 },
    ],
    tradfi_markets: [],
  },
  {
    ...DEMO_INFO[1], ...q(181.42, 64210000, 5120000),
    tokens: [
      { symbol: "NVDA.A", name: "NVDA token A (demo)", price: 181.6, crypto_id: 900001, market_cap: 41200000 },
      { symbol: "NVDA.B", name: "NVDA token B (demo)", price: 181.1, crypto_id: 900002, market_cap: 23010000 },
    ],
    tradfi_markets: [{ exchange_name: "NASDAQ", ticker: "NVDA", price: 181.3, currency: "USD" }],
  },
  {
    ...DEMO_INFO[2], ...q(412.37, 82100000, 4300000),
    tokens: [
      { symbol: "TSLA.A", name: "TSLA token A (demo)", price: 412.9, crypto_id: 900003, market_cap: 51700000 },
      { symbol: "TSLA.B", name: "TSLA token B (demo)", price: 411.8, crypto_id: 900004, market_cap: 20400000 },
      { symbol: "TSLA.C", name: "TSLA token C (demo)", price: 412.2, crypto_id: 900005, market_cap: 10000000 },
    ],
    tradfi_markets: [{ exchange_name: "NASDAQ", ticker: "TSLA", price: 412.05, currency: "USD" }],
  },
  {
    ...DEMO_INFO[3], ...q(236.5, 18400000, 2900000),
    tokens: [{ symbol: "SPCX", name: "SpaceX tokenized stock (Backpack)", price: 236.5, crypto_id: 40238, market_cap: 18400000 }],
    tradfi_markets: [],
  },
  {
    ...DEMO_INFO[4], ...q(1.0012, 540000000, 1800000),
    tokens: [{ symbol: "TBILL.A", name: "Treasury fund token (demo)", price: 1.0012, crypto_id: 900006, market_cap: 540000000 }],
    tradfi_markets: [],
  },
];

export const DEMO_ISSUERS: CmcIssuerData[] = [
  {
    issuer_id: "6a2d54b697c45356b1a634f4", name: "Backpack", num_tokens: 1, active: true,
    tokens: [{ crypto_id: 40238, name: "SpaceX tokenized stock (Backpack)", symbol: "SPCX", rwa_id: 9 }],
  },
  {
    issuer_id: "000000000000000000000d01", name: "Demo Issuer A", num_tokens: 3, active: true,
    tokens: [
      { crypto_id: 900001, symbol: "NVDA.A", rwa_id: 2 },
      { crypto_id: 900003, symbol: "TSLA.A", rwa_id: 14 },
      { crypto_id: 900002, symbol: "NVDA.B", rwa_id: 2 },
    ],
  },
  {
    issuer_id: "000000000000000000000d02", name: "Demo Issuer B", num_tokens: 2, active: true,
    tokens: [
      { crypto_id: 900004, symbol: "TSLA.B", rwa_id: 14 },
      { crypto_id: 900005, symbol: "TSLA.C", rwa_id: 14 },
    ],
  },
  {
    issuer_id: "000000000000000000000d03", name: "Paxos", num_tokens: 1, active: true,
    tokens: [{ crypto_id: 4705, symbol: "PAXG", rwa_id: 1 }],
  },
  {
    issuer_id: "000000000000000000000d04", name: "Matrixdock", num_tokens: 1, active: true,
    tokens: [{ crypto_id: 34212, symbol: "XAUM", rwa_id: 1 }],
  },
];

const chain = (id: number, name: string, platform: string, extra: string[] = []): CmcCryptoInfoItem => ({
  id, name, symbol: "", logo: null, platform: { name: platform },
  contract_address: extra.map((p) => ({ contract_address: "0x0", platform: { name: p } })),
});

export const DEMO_CRYPTO_INFO: CmcCryptoInfoItem[] = [
  chain(4705, "PAX Gold", "Ethereum"),
  chain(34212, "Matrixdock Gold", "Ethereum", ["BNB Smart Chain (BEP20)"]),
  chain(900001, "NVDA token A", "Solana"),
  chain(900002, "NVDA token B", "Ethereum", ["Gnosis Chain"]),
  chain(900003, "TSLA token A", "Solana"),
  chain(900004, "TSLA token B", "Ethereum"),
  chain(900005, "TSLA token C", "Ethereum", ["BNB Smart Chain (BEP20)"]),
  chain(40238, "SpaceX tokenized stock", "Solana"),
];

// Live Quotes Latest carries issuer_id / issuer_name on each token; mirror that here.
const ISSUER_BY_CRYPTO = new Map(DEMO_ISSUERS.flatMap((i) => (i.tokens ?? []).map((t) => [t.crypto_id, i] as const)));
for (const q of DEMO_QUOTES) {
  for (const t of q.tokens ?? []) {
    const issuer = ISSUER_BY_CRYPTO.get(t.crypto_id);
    if (issuer) Object.assign(t, { issuer_id: issuer.issuer_id, issuer_name: issuer.name });
  }
}
