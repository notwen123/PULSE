# PULSE

**The verification layer for tokenized markets.**
Every asset explained. Every number comes with a receipt.

PULSE resolves a tokenized real-world asset (TSLA, GOLD, Apple…) to its stable CoinMarketCap `rwa_id`, shows its issuers, token representations and chains on one **RWA Passport**, and attaches a **data receipt** to every important number: which CMC endpoint produced it, when, for which identifier, and a SHA-256 fingerprint of the response PULSE received.

Track: **Real World Assets** · Build with CMC: API Hackathon

---

## Problem

A person who sees `TSLA`, a TSLA token on Solana, a TSLA token on Ethereum and a "tokenized Tesla" from some issuer can't easily tell:

- what the underlying asset is,
- which tokens represent it, who issued them and on which chain,
- what the current market data says, when it was retrieved and where it came from.

The names look alike. The instruments are not the same.

## Solution

| Surface | What it does |
| --- | --- |
| **RWA Passport** (`/passport/[rwaId]`) | Underlying asset → RWA ID → issuers / token representations → chains. Tokenized aggregate quote, per-token prices, TradFi reference, and company facts, but only the fields CMC returned. |
| **Truth Receipt** | Tap any value to see its endpoint, query, JSON field path, `rwa_id` / `crypto_id`, retrieval time, CMC timestamp, `credit_count`, response hash, and a ready-to-run `curl`. |
| **Explain this asset** | A plain-English summary built deterministically from the Passport fields. No LLM, no inference, no recommendations. |
| **Daily Pulse** (`/pulse`) | Fear & Greed, Altcoin Season, global market cap / volume / BTC & ETH dominance, and your saved RWAs, each with a receipt. |
| **Evidence API** (`/api/verify`) | The same receipts as JSON for scripts and agents. |
| **My RWAs** (`/saved`) | Saved assets, recent views and a small streak/XP counter, stored in the browser. No account needed. |

## Why CoinMarketCap

CMC's RWA endpoints introduce `rwa_id`, a stable identifier for the asset itself, separate from `crypto_id` for the on-chain token. That split is what makes a Passport possible: the map resolves a ticker to one asset, quotes return the aggregate across its tokens *and* the tokens themselves, and the issuer endpoints link each token back to who minted it. CMC's standard `status` envelope (`timestamp`, `credit_count`, `error_code`) is what turns each number into a receipt.

## CMC API endpoints used

| Endpoint | Used for |
| --- | --- |
| `GET /v5/real-world-assets/map` | Search → `rwa_id` resolution |
| `GET /v5/real-world-assets/info` | Passport metadata, company facts |
| `GET /v5/real-world-assets/quotes/latest` | Tokenized aggregate, token prices, TradFi reference, saved RWAs |
| `GET /v5/real-world-assets/assets/list` | All RWAs page |
| `GET /v5/real-world-assets/issuers/list` | Issuers page, Passport issuer cards |
| `GET /v5/real-world-assets/issuers` | Issuer → tokens → Passports |
| `GET /v2/cryptocurrency/info` | Chain/platform of each token (one batched call) |
| `GET /v1/global-metrics/quotes/latest` | Daily Pulse global market |
| `GET /v3/fear-and-greed/latest` | Daily Pulse market mood |
| `GET /v1/altcoin-season-index/latest` | Daily Pulse market season |

`/v5/real-world-assets/market-pairs/list` is **not** used. It requires a Growth plan or above, and the core flow doesn't need it. Details, plan assumptions and caching are in [ENDPOINTS_USED.md](ENDPOINTS_USED.md). Real captured responses are in [`evidence/live/`](evidence/live/).

## Architecture

```
User
  ↓  search "TSLA"
PULSE (Next.js App Router, server components + route handlers)
  ↓
RWA identity layer   src/lib/api/rwa.ts
  map → rwa_id  ·  info ∥ quotes  ·  crypto info (batched) + issuers list (cached)
  ↓
CMC client           src/lib/api/cmc.ts   (server-only; timeout, retry/backoff, 429, error_code, no secrets logged)
  ↓
CoinMarketCap Pro API
  ↓
Normalizers          src/lib/api/normalizers.ts   (raw CMC → stable internal types; missing = null, never invented)
  ↓
Evidence receipt     src/lib/receipt.ts   (canonical JSON → SHA-256, timestamps, credit_count, status)
```

A Passport view costs at most four CMC calls: `info` and `quotes` in parallel, then one batched `/v2/cryptocurrency/info` and the cached Issuers List. Issuers come straight from `tokens[].issuer_id`, so there is no per-issuer fan-out. Metadata and issuers are cached for 15 minutes, quotes for 60 seconds (matching CMC's documented update frequency), and crypto metadata for a day.

**Currencies.** USD / EUR / INR use CMC `convert`. The tokenized aggregate comes back converted in `quotes[]`. Per-token prices are USD only, and the Passport labels them that way.

**Data modes.** With `CMC_API_KEY` set, every page shows **LIVE CMC DATA**. Without it, RWA pages render clearly labelled **DEMO DATA** fixtures (`src/lib/fixtures/demo.ts`), and their receipts say `demo` rather than `verified`. Fear & Greed and Altcoin Season use CMC's documented keyless `/public-api` endpoints when no key is set.

## Running locally

```bash
npm install
cp .env.example .env.local     # then add your CMC_API_KEY
npm run dev                    # http://localhost:3000
```

```bash
npm test          # vitest: normalization, rwa_id resolution, receipts, hashing, formatting, null handling
npm run lint      # eslint + tsc --noEmit
npm run build
npm run evidence  # capture real CMC responses into evidence/live/ (needs CMC_API_KEY)
```

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `CMC_API_KEY` | For live data | CoinMarketCap Pro API key. Read server-side only, sent as the `X-CMC_PRO_API_KEY` header. Never use a `NEXT_PUBLIC_` prefix. |
| `CMC_API_BASE_URL` | No | Defaults to `https://pro-api.coinmarketcap.com`. |

## Demo flow

1. Open `/` and search **TSLA** (or tap an example chip). The dropdown shows the result resolved by the RWA ID Map.
2. Press Enter. The **Passport** opens at `/passport/<rwa_id>`.
3. Scroll to **Identity**: Tesla, Inc. → RWA ID 14 → issuers (e.g. Backed Assets, Dinari Assets) / tokens (e.g. TSLAX) → chains.
4. Look at **Individual token representations**: each token's `crypto_id`, issuer, chain and price.
5. Tap **Average tokenized price**. The **data receipt** opens with endpoint, timestamps, credit count, response hash and `curl`.
6. Tap **Explain this asset**, then **Save**.
7. Open **Daily Pulse** (`/pulse`): market mood, season, global metrics and your saved RWA.
8. Open **Evidence API** (`/developers`) and run `rwa-quote` for GOLD against the live deployment.

## Evidence API

```bash
curl 'http://localhost:3000/api/verify?q=rwa-quote&symbol=TSLA'
```

Queries: `rwa-identity`, `rwa-quote` (both take `symbol` or `rwa_id`, optional `convert`), `fear-and-greed`, `altcoin-season`, `btc-dominance`. Each response includes `answer`, `value`, `source`, `endpoint`, `params`, `field`, `identifier`, `retrievedAt`, `cmcTimestamp`, `responseHash`, `creditCount`, `verificationStatus` and `mode`. PULSE does not proxy or replace CMC's MCP server. It adds a provenance layer that an agent can call as a plain HTTP tool.

## API feedback

See [FEEDBACK.md](FEEDBACK.md).

## Security

- The CMC key lives only in `src/lib/api/cmc.ts`, which imports `server-only`. The build fails if a client component imports it.
- The key is never logged, never returned in API responses, and never written into receipts or evidence files. Receipts carry query params, which never include the key.
- `.env*.local` is git-ignored; `.env.example` holds no values.
- Route handlers validate `rwa_id`, `issuer_id`, `symbol` length, `asset_type` and `convert` before calling CMC.

## Responsible use

PULSE describes CMC-sourced data. It makes no buy or sell recommendations and computes no risk scores. The response hash fingerprints the payload PULSE received. It is not proof that a market value is correct.

## License and attribution

MIT, see [LICENSE](LICENSE). This repository began as an open-source, MIT-licensed Next.js + shadcn/ui crypto dashboard built on CoinGecko. Its App Router scaffold, Tailwind setup, shadcn primitives (`sheet`, `skeleton`, `sonner`), theme provider and currency-cookie pattern were kept. The CoinGecko data layer, pages and components were removed and replaced by the CMC RWA product described above. Market data is provided by CoinMarketCap.

## Deploying to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js; `vercel.json` pins the framework and the `iad1` region.
2. Add the environment variable `CMC_API_KEY` (Production and Preview). Leave `CMC_API_BASE_URL` unset.
3. Deploy. Without the key, the site still works but RWA pages show labelled DEMO DATA.
