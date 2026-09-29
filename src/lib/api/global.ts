import "server-only";
import { makeReceipt } from "@/lib/receipt";
import type { DailyPulse } from "@/lib/types";
import { cmcGet, describeCmcError } from "./cmc";
import type { CmcAltcoinSeasonData, CmcFearGreedData, CmcGlobalMetricsData } from "./cmc-types";

export const GLOBAL = {
  metrics: "/v1/global-metrics/quotes/latest",
  fearGreed: "/v3/fear-and-greed/latest",
  altcoinSeason: "/v1/altcoin-season-index/latest",
} as const;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Daily Pulse market context. Each source loads independently, so one
 * failure never blanks the page. Fear & Greed and Altcoin Season fall back
 * to CMC's documented keyless /public-api when no key is configured.
 */
export async function getDailyPulse(currency: string): Promise<DailyPulse> {
  const cur = currency.toUpperCase();
  const [fg, alt, gm] = await Promise.allSettled([
    cmcGet<CmcFearGreedData>(GLOBAL.fearGreed, {}, { revalidate: 900, keyless: true }),
    cmcGet<CmcAltcoinSeasonData>(GLOBAL.altcoinSeason, {}, { revalidate: 900, keyless: true }),
    cmcGet<CmcGlobalMetricsData>(GLOBAL.metrics, { convert: cur }, { revalidate: 300 }),
  ]);

  const errors: string[] = [];
  const out: DailyPulse = { generatedAt: new Date().toISOString(), fearGreed: null, altcoinSeason: null, global: null, errors };

  if (fg.status === "fulfilled") {
    const value = num(fg.value.data.value);
    if (value != null) {
      out.fearGreed = {
        value,
        classification: fg.value.data.value_classification ?? null,
        receipt: makeReceipt(fg.value.meta, {
          label: "Fear & Greed Index",
          field: "data.value",
          value,
          sourceTimestamp: fg.value.data.update_time,
        }),
      };
    }
  } else errors.push(`Fear & Greed: ${describeCmcError(fg.reason).title}`);

  if (alt.status === "fulfilled") {
    const value = num(alt.value.data.altcoin_index);
    if (value != null) {
      out.altcoinSeason = {
        value,
        receipt: makeReceipt(alt.value.meta, {
          label: "Altcoin Season Index",
          field: "data.altcoin_index",
          value,
          sourceTimestamp: alt.value.data.snapshot_time ?? alt.value.data.update_time ?? alt.value.data.timestamp,
        }),
      };
    }
  } else errors.push(`Altcoin Season: ${describeCmcError(alt.reason).title}`);

  if (gm.status === "fulfilled") {
    const d = gm.value.data;
    const q = d.quote?.[cur] ?? d.quote?.USD;
    const qCur = d.quote?.[cur] ? cur : "USD";
    const ts = q?.last_updated ?? d.last_updated;
    const r = (label: string, field: string, value: unknown) =>
      makeReceipt(gm.value.meta, { label, field, value, sourceTimestamp: ts });
    out.global = {
      totalMarketCap: num(q?.total_market_cap),
      totalVolume24h: num(q?.total_volume_24h),
      marketCapChange24h: num(q?.total_market_cap_yesterday_percentage_change),
      btcDominance: num(d.btc_dominance),
      ethDominance: num(d.eth_dominance),
      receipts: {
        totalMarketCap: r("Total crypto market cap", `data.quote.${qCur}.total_market_cap`, q?.total_market_cap),
        totalVolume24h: r("Total 24h volume", `data.quote.${qCur}.total_volume_24h`, q?.total_volume_24h),
        btcDominance: r("BTC dominance", "data.btc_dominance", d.btc_dominance),
        ethDominance: r("ETH dominance", "data.eth_dominance", d.eth_dominance),
      },
    };
  } else errors.push(`Global metrics: ${describeCmcError(gm.reason).title}`);

  return out;
}
