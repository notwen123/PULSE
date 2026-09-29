/**
 * Stable internal types consumed by the UI. Raw CMC shapes live in
 * ./api/cmc-types.ts and are converted by ./api/normalizers.ts.
 */

export type DataMode = "live" | "demo";

export type VerificationStatus = "verified" | "demo" | "unavailable" | "error";

/** Where a number came from. Every important metric in PULSE carries one. */
export interface EvidenceReceipt {
  source: "CoinMarketCap";
  /** Endpoint path, e.g. /v5/real-world-assets/quotes/latest */
  endpoint: string;
  /** Query params sent (never includes the API key). */
  params: Record<string, string>;
  identifier?: { type: string; value: string };
  rwaId?: number;
  /** Human label of the field, e.g. "Average tokenized price". */
  label: string;
  /** JSON path of the value inside the response, e.g. data.rwa_assets[0].tokenized_market_cap */
  field?: string;
  value: string | number | boolean | null;
  /** When PULSE received the response (ISO 8601). */
  retrievedAt: string;
  /** status.timestamp or the record's own last_updated, if CMC returned one. */
  sourceTimestamp?: string;
  creditCount?: number;
  elapsedMs?: number;
  /** SHA-256 of the canonical JSON of the full response PULSE received. */
  responseHash: string;
  verificationStatus: VerificationStatus;
  mode: DataMode;
}

/** Metadata about one CMC response, shared by every receipt derived from it. */
export interface ResponseMeta {
  endpoint: string;
  params: Record<string, string>;
  retrievedAt: string;
  sourceTimestamp?: string;
  creditCount?: number;
  elapsedMs?: number;
  notice?: string;
  responseHash: string;
  mode: DataMode;
}

export type AssetType =
  | "stock"
  | "commodity"
  | "currency"
  | "government_security"
  | "etf"
  | "real_estate"
  | "unknown";

export interface RwaIdentity {
  rwaId: number;
  name: string;
  symbol: string;
  slug: string | null;
  assetType: AssetType;
  rank: number | null;
  hasTokens: boolean | null;
}

export interface RwaProfile extends RwaIdentity {
  description: string | null;
  logo: string | null;
  website: string | null;
  /** Only fields CMC actually returned (non-null). */
  facts: { label: string; value: string }[];
}

export interface TokenRepresentation {
  cryptoId: number;
  name: string | null;
  symbol: string | null;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  /** Currency of price/marketCap as returned by CMC (token prices are USD). */
  currency: string;
  issuer: { id: string; name: string } | null;
  chains: string[];
  logo: string | null;
  priceReceipt: EvidenceReceipt | null;
}

export interface TradfiMarket {
  venue: string | null;
  ticker: string | null;
  url: string | null;
  price: number | null;
  currency: string | null;
}

export interface AggregateQuote {
  averageTokenizedPrice: number | null;
  tokenizedMarketCap: number | null;
  tokenizedVolume24h: number | null;
  lastUpdated: string | null;
  receipts: {
    averageTokenizedPrice: EvidenceReceipt;
    tokenizedMarketCap: EvidenceReceipt;
    tokenizedVolume24h: EvidenceReceipt;
  };
}

export interface IssuerSummary {
  id: string;
  name: string;
  numTokens: number | null;
  active: boolean | null;
  website: string | null;
}

export interface Passport {
  mode: DataMode;
  currency: string;
  profile: RwaProfile;
  identityReceipt: EvidenceReceipt;
  aggregate: AggregateQuote | null;
  tokens: TokenRepresentation[];
  tradfi: TradfiMarket[];
  issuers: IssuerSummary[];
  chains: string[];
  /** Non-fatal problems (e.g. issuer index unavailable). Shown quietly in the UI. */
  warnings: string[];
  responses: ResponseMeta[];
}

export interface RwaListRow extends RwaIdentity {
  averageTokenizedPrice: number | null;
  tokenizedMarketCap: number | null;
  tokenizedVolume24h: number | null;
  tokenCount: number | null;
}

export interface DailyPulse {
  generatedAt: string;
  fearGreed: { value: number; classification: string | null; receipt: EvidenceReceipt } | null;
  altcoinSeason: { value: number; receipt: EvidenceReceipt } | null;
  global: {
    totalMarketCap: number | null;
    totalVolume24h: number | null;
    marketCapChange24h: number | null;
    btcDominance: number | null;
    ethDominance: number | null;
    receipts: Record<"totalMarketCap" | "totalVolume24h" | "btcDominance" | "ethDominance", EvidenceReceipt>;
  } | null;
  errors: string[];
}
