# CMC API feedback

These are notes from building PULSE against the CoinMarketCap Pro API. They cover only what we actually ran into.

## 1. What CMC made possible

A clean identity model for tokenized assets. `rwa_id` (the asset) and `crypto_id` (the token) are separate, stable namespaces. With them, one Passport page can show a single underlying asset, several issuer tokens and their chains without guessing from tickers. The SPCX example in the docs, where the symbol refers to both a Nasdaq listing and an on-chain token, is exactly the ambiguity PULSE is built to remove.

## 2. RWA relationships that were especially useful

- **Map → rwa_id at 0 credits.** Search can hit it freely, which makes "search feels instant" practical.
- **Quotes Latest returns both the aggregate and the tokens.** One call gives the tokenized aggregate and each representation's `crypto_id` and price. That's what lets PULSE clearly separate "aggregate" from "individual token".
- **`issuer_id` / `issuer_name` on each token**, plus Issuer → tokens with `rwa_id`. Together they give the identity graph in both directions.
- **The standard `status` envelope.** `timestamp` and `credit_count` on every response became the backbone of the data receipt.

## 3. What was easy

- The same `data` + `status` envelope as the rest of the Pro API, so one client handles every endpoint.
- Clear plan and credit notes per endpoint, and an explicit "Growth+" on Market Pairs, so the core flow could avoid it from the start.
- Keyless `/public-api` access for Fear & Greed and the Altcoin Season Index. Daily Pulse can show real values even before a key is configured.

## 4. What was difficult

- **The docs and live responses differ in places**, so we coded against the documented examples first and then corrected against live responses (saved in `evidence/live/`):
  - With `convert=EUR`, the converted aggregate comes back in a `quotes: [{ "symbol": "EUR", … }]` **array**. The flat `average_tokenized_price` etc. stay in **USD**. The reference wording ("its own quote object") suggested a `quote.EUR` object.
  - `tokens[]` in Quotes Latest **does** include `issuer_id` and `issuer_name`. The documented example omits them, so our first version called the Issuer endpoint once per issuer to build a token → issuer index. Once we saw the live response, we deleted that fan-out entirely.
  - `tradfi_markets[]` items are `{ exchange: { name, slug, exchange_id }, ticker, market_url }` with no price. The documented example is an empty array.
- **Token prices are USD only.** `tokens[].price` ignores `convert`, so a Passport in EUR shows the aggregate in EUR and the per-token prices in USD. PULSE labels that explicitly.
- **Chain/platform is not in the RWA responses.** We join each token's `crypto_id` against `/v2/cryptocurrency/info` in one batched call.

## 5. Missing fields encountered

- No chain/platform on `tokens[]`.
- No 24h percentage change on the tokenized aggregate. PULSE's "important changes" shows only what CMC returns (the global market-cap change) and computes nothing itself.
- For SpaceX (`rwa_id` 9), `about.description`, `about.logo`, `primary_exchange` and `cik` were `null` in the live response. The SpaceX walkthrough describes `primary_exchange` as NASDAQ. PULSE hides null facts.
- `government_security` currently returns `total_size: 0` on the map, so there are no tokenized treasuries to demo, despite the landing page listing the asset type.

## 6. Confusing documentation

- Per-field response schemas for the RWA models were hard to read on the schemas page. We started from the example responses in the RWA landing page and SpaceX walkthrough, then corrected against live data (above).
- The SpaceX walkthrough says the asset list and aggregate tokenized market data are "coming soon". Both work live.
- `status.error_code` is a **string** (`"0"`) on `/v3/fear-and-greed/latest` and the RWA endpoints but a **number** (`0`) on `/v1/altcoin-season-index/latest` in live responses. PULSE accepts both.
- The Altcoin Season timestamp is `snapshot_time`, which the guides we read didn't mention.
- An unknown `rwa_id` on `/v5/real-world-assets/info` returns HTTP 400 rather than 404. PULSE treats both as "not found".

## 7. Rate limits and caching

- No 429 responses were observed while building and testing. The client still handles 429 and `Retry-After` with bounded backoff (2 attempts).
- Observed `credit_count` matched the docs: map 0; info, quotes, list, issuers list, issuer, global metrics, fear & greed and altcoin season 1 each.
- The map pages 250 rows at 0 credits, so PULSE caches the top 1,000 by rank for an hour to support name search ("Apple", "Silver").
- We cache to match CMC's documented update frequencies: quotes 60s; metadata and issuers 15 min in PULSE, since they change slowly.

## 8. Product improvements that would help developers

1. `platform`/chain on each `tokens[]` item, and `convert` support for token prices.
2. A name/fuzzy search parameter on the RWA ID Map. Today a query like "US Treasury" requires paging the map client-side.
3. Document the live `quotes[]` array, the token issuer fields and the `tradfi_markets` item shape in the reference examples.
4. A machine-readable (OpenAPI) spec for the v5 RWA endpoints.
