// Captures real CMC responses for the endpoints PULSE uses into evidence/live/.
// Usage: CMC_API_KEY=... npm run evidence   (the key is sent only as a header and never written to disk)
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const key = process.env.CMC_API_KEY?.trim();
if (!key) {
  console.error("Set CMC_API_KEY first.");
  process.exit(1);
}
const BASE = process.env.CMC_API_BASE_URL?.trim() || "https://pro-api.coinmarketcap.com";

const CALLS = [
  ["rwa-map", "/v5/real-world-assets/map", { symbol: "TSLA,NVDA,GOLD,SPCX" }],
  ["rwa-info", "/v5/real-world-assets/info", { symbol: "SPCX" }],
  ["rwa-quotes-latest", "/v5/real-world-assets/quotes/latest", { symbol: "GOLD", convert: "USD" }],
  ["rwa-assets-list", "/v5/real-world-assets/assets/list", { limit: "5" }],
  ["rwa-issuers-list", "/v5/real-world-assets/issuers/list", { limit: "10" }],
  ["rwa-issuer", "/v5/real-world-assets/issuers", { issuer_id: "6a2d54b697c45356b1a634f4" }],
  ["global-metrics", "/v1/global-metrics/quotes/latest", {}],
  ["fear-and-greed", "/v3/fear-and-greed/latest", {}],
  ["altcoin-season", "/v1/altcoin-season-index/latest", {}],
];

const canonical = (v) =>
  v === null || typeof v !== "object"
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? `[${v.map(canonical).join(",")}]`
      : `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;

await mkdir("evidence/live", { recursive: true });
for (const [name, path, params] of CALLS) {
  const url = `${BASE}${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json", "X-CMC_PRO_API_KEY": key } });
  const body = await res.json().catch(() => null);
  const out = {
    _note: "LIVE CMC RESPONSE captured by scripts/capture-evidence.mjs. API key omitted.",
    request: `GET ${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`,
    httpStatus: res.status,
    capturedAt: new Date().toISOString(),
    sha256: body ? createHash("sha256").update(canonical(body)).digest("hex") : null,
    response: body,
  };
  await writeFile(`evidence/live/${name}.json`, JSON.stringify(out, null, 2));
  console.log(`${res.status} ${path} → evidence/live/${name}.json (credits: ${body?.status?.credit_count ?? "?"})`);
}
