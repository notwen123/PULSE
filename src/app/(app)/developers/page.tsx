import type { Metadata } from "next";
import { ENDPOINTS_USED } from "@/lib/endpoints";
import { TryVerify } from "@/components/developers/try-verify";

export const metadata: Metadata = { title: "Evidence API" };

const RESPONSE = `{
  "query": "rwa-quote",
  "answer": "Average tokenized price of GOLD: $4,018.18 (aggregate across tracked tokens).",
  "value": 4018.181479970762,
  "source": "CoinMarketCap",
  "endpoint": "/v5/real-world-assets/quotes/latest",
  "params": { "rwa_id": "1", "convert": "USD", "skip_invalid": "true" },
  "field": "data.rwa_assets[0].average_tokenized_price",
  "identifier": { "type": "rwa_id", "value": "1" },
  "retrievedAt": "2026-09-29T18:02:41.000Z",
  "cmcTimestamp": "2026-09-29T18:02:39.000Z",
  "responseHash": "3f9a1c…",
  "creditCount": 1,
  "verificationStatus": "verified",
  "mode": "live"
}`;

const ROUTES = [
  ["GET /api/verify?q=…", "Structured verification: rwa-identity, rwa-quote, fear-and-greed, altcoin-season, btc-dominance"],
  ["GET /api/receipt?rwa_id=&field=", "Receipt for one Passport value (or &crypto_id= for a token price)"],
  ["GET /api/rwa/map?q=", "Search: ticker or name → RWA identities"],
  ["GET /api/rwa/info?rwa_id=", "Normalized metadata"],
  ["GET /api/rwa/quotes?rwa_id=1,2&convert=", "Batched tokenized quotes"],
  ["GET /api/rwa/list?asset_type=", "Tracked RWAs by rank"],
  ["GET /api/rwa/issuers", "Issuers"],
  ["GET /api/rwa/issuer?issuer_id=", "One issuer with linked tokens"],
  ["GET /api/pulse?convert=", "Daily Pulse with receipts"],
];

export default function DevelopersPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-12 sm:px-6">
      <header>
        <p className="eyebrow">Developer</p>
        <h1 className="mt-2 display text-5xl sm:text-6xl">Evidence API</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The receipts behind every PULSE number, as JSON. Agents and scripts can ask a narrow, structured question and get the
          value together with its source endpoint, timestamps, identifier, credit count and response hash. The API key stays on the server.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <p className="eyebrow">Try it · live against this deployment</p>
        <TryVerify />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Response shape</p>
          <pre className="overflow-x-auto rounded-2xl border bg-paper p-4 font-mono text-[11.5px] leading-relaxed">{RESPONSE}</pre>
          <p className="text-xs text-muted-foreground">Example shape. verificationStatus is &quot;demo&quot; when no CMC key is configured, and &quot;unavailable&quot; when CMC omits the field.</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Routes</p>
          <div className="overflow-hidden rounded-2xl border bg-paper">
            {ROUTES.map(([r, d]) => (
              <div key={r} className="border-b px-4 py-3 last:border-b-0">
                <code className="font-mono text-[12px]">{r}</code>
                <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Agent-ready: register <code className="font-mono text-xs">/api/verify</code> as an HTTP tool. PULSE does not proxy or replace
            CMC&apos;s own MCP server; it adds the provenance layer on top.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="eyebrow">CMC endpoints used</p>
        <div className="overflow-hidden rounded-2xl border bg-paper">
          {ENDPOINTS_USED.map((e) => (
            <div key={e.path} className="grid gap-1 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[18rem_10rem_1fr] sm:items-center sm:gap-4">
              <code className="font-mono text-[12px]">{e.path}</code>
              <span className="text-sm font-medium">{e.name}</span>
              <span className="text-sm text-muted-foreground">{e.use}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          /v5/real-world-assets/market-pairs/list is not used: it is Growth plan and above, and the core flow does not need it.
        </p>
      </section>
    </div>
  );
}
