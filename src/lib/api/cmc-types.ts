/**
 * Raw CoinMarketCap Pro API response types.
 *
 * Shapes follow the public CMC reference and example responses:
 * https://coinmarketcap.com/api/documentation/pro-api-reference/real-world-assets
 *
 * Everything outside the documented core is optional: the UI never depends on
 * a field that CMC might omit. Normalizers in ./normalizers.ts turn these into
 * the stable internal types in ./types.ts.
 */

/** Standard CMC `status` envelope. */
export interface CmcStatus {
  timestamp?: string;
  error_code?: number | string;
  error_message?: string | null;
  elapsed?: number;
  credit_count?: number;
  notice?: string | null;
}

export interface CmcEnvelope<T> {
  data: T | null;
  status: CmcStatus;
}

export type CmcAssetType =
  | "stock"
  | "commodity"
  | "currency"
  | "government_security"
  | "etf"
  | "real_estate";

/** GET /v5/real-world-assets/map → data.rwa_assets[] */
export interface CmcRwaMapItem {
  rwa_id: number;
  name: string;
  symbol: string;
  slug?: string;
  asset_type?: string;
  rwa_rank?: number | null;
  has_tokens?: boolean;
}

export interface CmcRwaMapData {
  rwa_assets: CmcRwaMapItem[];
  total_size?: number;
  has_more?: boolean;
}

/** GET /v5/real-world-assets/info → data.rwa_assets[] */
export interface CmcRwaInfoItem extends CmcRwaMapItem {
  industry?: string | null;
  founded?: string | null;
  employees?: number | null;
  primary_exchange?: string | null;
  cik?: string | null;
  website?: string | null;
  about?: {
    description?: string | null;
    logo?: string | null;
    website?: string | null;
  } | null;
}

export interface CmcRwaInfoData {
  rwa_assets: CmcRwaInfoItem[];
}

/** A currency-keyed quote block, returned when `convert` is used. */
export interface CmcRwaQuoteBlock {
  average_tokenized_price?: number | null;
  tokenized_market_cap?: number | null;
  tokenized_volume_24h?: number | null;
  price?: number | null;
  market_cap?: number | null;
  volume_24h?: number | null;
  last_updated?: string | null;
}

/** Converted aggregate returned in `quotes[]` (one entry per `convert` currency). */
export interface CmcRwaConvertedQuote extends CmcRwaQuoteBlock {
  symbol: string;
  crypto_id?: number;
}

/** One on-chain token representing an RWA (Quotes Latest `tokens[]`). Prices are USD. */
export interface CmcRwaToken {
  crypto_id: number;
  name?: string;
  symbol?: string;
  issuer_id?: string | null;
  issuer_name?: string | null;
  price?: number | null;
  market_cap?: number | null;
  volume_24h?: number | null;
  last_updated?: string | null;
  quote?: Record<string, CmcRwaQuoteBlock>;
}

/** TradFi market row. Live responses carry `exchange` as an object and no price. */
export interface CmcTradfiMarket {
  exchange?: string | { name?: string | null; slug?: string | null; exchange_id?: number } | null;
  market_url?: string | null;
  exchange_name?: string | null;
  name?: string | null;
  symbol?: string | null;
  ticker?: string | null;
  price?: number | null;
  currency?: string | null;
  last_updated?: string | null;
}

/** GET /v5/real-world-assets/quotes/latest and /assets/list → data.rwa_assets[] */
export interface CmcRwaQuoteItem extends CmcRwaMapItem, CmcRwaQuoteBlock {
  quotes?: CmcRwaConvertedQuote[];
  quote?: Record<string, CmcRwaQuoteBlock>;
  tokens?: CmcRwaToken[];
  tradfi_markets?: CmcTradfiMarket[];
}

export interface CmcRwaQuoteData {
  rwa_assets: CmcRwaQuoteItem[];
  total_size?: number;
  has_more?: boolean;
}

/** GET /v5/real-world-assets/issuers/list → data.issuers[] (key tolerated as array too). */
export interface CmcIssuerListItem {
  issuer_id: string;
  name: string;
  num_tokens?: number;
  active?: boolean;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
}

export type CmcIssuerListData =
  | { issuers: CmcIssuerListItem[]; total_size?: number; has_more?: boolean }
  | CmcIssuerListItem[];

/** GET /v5/real-world-assets/issuers → data */
export interface CmcIssuerToken {
  crypto_id: number;
  name?: string;
  symbol?: string;
  rwa_id?: number;
}

export interface CmcIssuerData extends CmcIssuerListItem {
  tokens?: CmcIssuerToken[];
}

/** GET /v2/cryptocurrency/info → data[id] (subset used for chain/platform) */
export interface CmcCryptoInfoItem {
  id: number;
  name: string;
  symbol: string;
  logo?: string | null;
  platform?: { name?: string; slug?: string; token_address?: string } | null;
  contract_address?: {
    contract_address: string;
    platform?: { name?: string; coin?: { name?: string } };
  }[];
}

export type CmcCryptoInfoData = Record<string, CmcCryptoInfoItem | CmcCryptoInfoItem[]>;

/** GET /v1/global-metrics/quotes/latest → data */
export interface CmcGlobalMetricsData {
  btc_dominance?: number | null;
  eth_dominance?: number | null;
  active_cryptocurrencies?: number | null;
  last_updated?: string | null;
  quote?: Record<
    string,
    {
      total_market_cap?: number | null;
      total_volume_24h?: number | null;
      total_market_cap_yesterday_percentage_change?: number | null;
      total_volume_24h_yesterday_percentage_change?: number | null;
      last_updated?: string | null;
    }
  >;
}

/** GET /v3/fear-and-greed/latest → data */
export interface CmcFearGreedData {
  value?: number | null;
  value_classification?: string | null;
  update_time?: string | null;
}

/** GET /v1/altcoin-season-index/latest → data */
export interface CmcAltcoinSeasonData {
  altcoin_index?: number | null;
  snapshot_time?: string | null;
  timestamp?: string | null;
  update_time?: string | null;
  last_updated?: string | null;
}
