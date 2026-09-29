import { describe, expect, it } from "vitest";
import { formatCompactMoney, formatMoney, formatPercent, formatUtcTime } from "@/lib/format";
import { explainPassport } from "@/lib/explain";
import type { EvidenceReceipt, Passport } from "@/lib/types";

describe("formatting", () => {
  it("formats quotes per currency", () => {
    expect(formatMoney(149.28, "USD")).toBe("$149.28");
    expect(formatMoney(4018.181479970762, "usd")).toBe("$4,018.18");
    expect(formatMoney(1.0012, "EUR")).toBe("€1.0012");
    expect(formatMoney(12, "INR")).toBe("₹12.00");
    expect(formatCompactMoney(82_100_000, "USD")).toBe("$82.1M");
  });
  it("renders missing values as an em dash, never zero", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatCompactMoney(undefined)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
    expect(formatUtcTime("not a date")).toBe("—");
  });
  it("formats UTC timestamps", () => {
    expect(formatUtcTime("2026-09-29T18:02:41.123Z")).toBe("2026-09-29 18:02:41 UTC");
    expect(formatPercent(1.234, { signed: true })).toBe("+1.23%");
  });
});

const receipt = { verificationStatus: "verified" } as EvidenceReceipt;
const base: Passport = {
  mode: "live",
  currency: "USD",
  profile: { rwaId: 9, name: "SpaceX", symbol: "SPCX", slug: "spacex", assetType: "stock", rank: 7, hasTokens: true, description: null, logo: null, website: null, facts: [] },
  identityReceipt: receipt,
  aggregate: null,
  tokens: [],
  tradfi: [],
  issuers: [],
  chains: [],
  warnings: [],
  responses: [],
};

describe("explainPassport", () => {
  it("states only facts present in the data", () => {
    const text = explainPassport(base).join(" ");
    expect(text).toContain("RWA ID 9");
    expect(text).toContain("ranked #7");
    expect(text).toContain("No aggregate tokenized quote");
    expect(text).not.toMatch(/\bbuy\b|\bsell\b/i);
  });

  it("describes representations, issuers, chains and the aggregate", () => {
    const text = explainPassport({
      ...base,
      aggregate: { averageTokenizedPrice: 236.5, tokenizedMarketCap: null, tokenizedVolume24h: null, lastUpdated: null, receipts: {} as never },
      tokens: [{ cryptoId: 40238 } as never, { cryptoId: 1 } as never],
      issuers: [{ id: "x", name: "Backpack", numTokens: 1, active: true, website: null }],
      chains: ["Solana"],
    }).join(" ");
    expect(text).toContain("2 tokenized representations");
    expect(text).toContain("1 issuer (Backpack)");
    expect(text).toContain("1 chain (Solana)");
    expect(text).toContain("$236.50");
    expect(text).toContain("not the price of any single token");
  });
});

import { parseAbout } from "@/lib/format";

describe("parseAbout", () => {
  it("splits CMC markdown Q&A sections and flattens links", () => {
    const s = parseAbout(
      "### What is Tesla? Tesla makes EVs. ### How to trade it? Via [TSLA](https://coinmarketcap.com/currencies/tesla-tokenized-stock-xstock/) on **exchanges**."
    );
    expect(s).toEqual([
      { title: "What is Tesla?", body: "Tesla makes EVs." },
      { title: "How to trade it?", body: "Via TSLA on exchanges." },
    ]);
  });
  it("keeps plain descriptions whole and handles null", () => {
    expect(parseAbout("Space launch company.")).toEqual([{ title: null, body: "Space launch company." }]);
    expect(parseAbout(null)).toEqual([]);
  });
});
