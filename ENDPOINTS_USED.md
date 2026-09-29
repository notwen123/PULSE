# CMC endpoints used by PULSE

Every endpoint below is called from `src/lib/api/` through the single server-side client in `src/lib/api/cmc.ts`. Plan and credit notes come from the public CMC reference (checked September 2026). Revalidation values are PULSE's Next.js data-cache settings.

| Endpoint | Purpose | Where in product | Plan / credits (per CMC docs) | Fields PULSE reads | PULSE cache |
| --- | --- | --- | --- | --- | --- |
| `/v5/real-world-assets/map` | Resolve ticker/name → `rwa_id` | Search (header, hero, `/passport`), `/api/rwa/map`, `/api/verify` | Basic+ · 0 credits · updates every 30s | `data.rwa_assets[].{rwa_id,name,symbol,slug,asset_type,rwa_rank,has_tokens}` | 5 min (exact symbol), 1 h (top-1000 index for name search) |
| `/v5/real-world-assets/info` | Static metadata | Passport header, facts, description | Basic+ · 1 credit / 250 assets · 30s | `rwa_assets[].{industry,founded,employees,primary_exchange,cik,about.{description,logo,website}}` | 15 min |
| `/v5/real-world-assets/quotes/latest` | Tokenized aggregate + tokens + TradFi | Passport metrics, token cards, TradFi, saved RWAs, `/api/receipt`, `/api/verify` | Basic+ · 1 credit / 250 assets (+1 per extra convert) · 60s | flat `average_tokenized_price`, `tokenized_market_cap`, `tokenized_volume_24h`, `last_updated` (USD); `quotes[]` entry matching `convert`; `tokens[].{crypto_id,name,symbol,issuer_id,issuer_name,price,market_cap,volume_24h}` (USD); `tradfi_markets[].{exchange.name,ticker,market_url}` | 60 s |
| `/v5/real-world-assets/assets/list` | Ranked list with aggregates | `/assets` | Basic+ · 1 credit / 250 assets · 1 min | same aggregate fields as quotes | 60 s |
| `/v5/real-world-assets/issuers/list` | Issuers | `/issuers`, Passport issuer cards (token counts, website) | Basic+ · 1 credit / request · 30s | `issuers[].{issuer_id,name,num_tokens,website,logo}` | 15 min |
| `/v5/real-world-assets/issuers` | One issuer + linked tokens | `/issuers/[id]` (issuer → tokens → Passports) | Basic+ · 1 credit / request · 30s | `tokens[].{crypto_id,name,symbol,rwa_id}` | 15 min |
| `/v2/cryptocurrency/info` | Chain/platform per token | Token cards "Chain", identity graph "Chains" | Basic+ · batched by id | `data[id].platform.name`, `contract_address[].platform.name`, `logo` | 24 h |
| `/v1/global-metrics/quotes/latest` | Global market context | Daily Pulse | Basic+ · 1 credit | `btc_dominance`, `eth_dominance`, `quote[CUR].{total_market_cap,total_volume_24h,total_market_cap_yesterday_percentage_change}` | 5 min |
| `/v3/fear-and-greed/latest` | Market mood | Daily Pulse, `/api/verify?q=fear-and-greed` | Basic+ · 1 credit · 15 min; also keyless via `/public-api` | `value`, `value_classification`, `update_time` | 15 min |
| `/v1/altcoin-season-index/latest` | Market season | Daily Pulse, `/api/verify?q=altcoin-season` | Basic+ · 1 credit · 15 min; also keyless via `/public-api` | `altcoin_index`, `snapshot_time` | 15 min |

## Not used

**`/v5/real-world-assets/market-pairs/list`** is **not** required by the main implementation. CMC lists it for Growth, Professional and Enterprise only. PULSE never claims venue coverage or a "cheapest market". It shows CMC-tracked quotes and nothing more.

## Request budget per screen

- **Search:** 1 map call (free) plus the cached map index.
- **Passport:** `info` ∥ `quotes`, then one `/v2/cryptocurrency/info` call for all token ids and the cached Issuers List. At most 4 calls, with no per-token or per-issuer fan-out (issuers come from `tokens[].issuer_id`).
- **Saved RWAs / Daily Pulse snapshot:** one `quotes` call for all saved `rwa_id`s.
- **Daily Pulse market:** 3 calls in parallel. Each one fails independently.

## Response shapes

Real responses captured from the Pro API are in [`evidence/live/`](evidence/live/) (API key omitted, each with its SHA-256). Doc-derived sanitized examples are in [`evidence/`](evidence/). Re-capture with `npm run evidence`.

`status` metadata preserved on every call: `timestamp`, `error_code`, `error_message`, `elapsed`, `credit_count`, `notice`.
