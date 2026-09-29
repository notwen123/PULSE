/** The CMC endpoints PULSE actually calls, with where each one is used. */
export const ENDPOINTS_USED = [
  { path: "/v5/real-world-assets/map", name: "RWA ID Map", use: "Search → rwa_id resolution (0 credits)" },
  { path: "/v5/real-world-assets/info", name: "Metadata", use: "Passport identity, description, company facts" },
  { path: "/v5/real-world-assets/quotes/latest", name: "Quotes Latest", use: "Tokenized aggregate, token prices, TradFi reference, saved RWAs" },
  { path: "/v5/real-world-assets/assets/list", name: "RWA List", use: "All RWAs page" },
  { path: "/v5/real-world-assets/issuers/list", name: "Issuers List", use: "Issuers page, issuer index" },
  { path: "/v5/real-world-assets/issuers", name: "Issuer", use: "Token → issuer relationships, issuer page" },
  { path: "/v2/cryptocurrency/info", name: "Cryptocurrency Metadata", use: "Chain/platform of each token representation (batched)" },
  { path: "/v1/global-metrics/quotes/latest", name: "Global Metrics", use: "Daily Pulse market cap, volume, BTC/ETH dominance" },
  { path: "/v3/fear-and-greed/latest", name: "Fear & Greed Latest", use: "Daily Pulse market mood" },
  { path: "/v1/altcoin-season-index/latest", name: "Altcoin Season Index", use: "Daily Pulse market season" },
] as const;
