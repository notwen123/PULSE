import { describe, expect, it } from "vitest";
import { canonicalJson, makeReceipt, responseHash } from "@/lib/receipt";
import type { ResponseMeta } from "@/lib/types";

const meta = (mode: "live" | "demo" = "live"): ResponseMeta => ({
  endpoint: "/v5/real-world-assets/quotes/latest",
  params: { rwa_id: "9" },
  retrievedAt: "2026-09-29T18:02:41.000Z",
  sourceTimestamp: "2026-09-29T18:02:39.000Z",
  creditCount: 1,
  responseHash: "abc",
  mode,
});

describe("response hashing", () => {
  it("is independent of key order", () => {
    const a = { status: { error_code: 0, credit_count: 1 }, data: { rwa_assets: [{ rwa_id: 9, symbol: "SPCX" }] } };
    const b = { data: { rwa_assets: [{ symbol: "SPCX", rwa_id: 9 }] }, status: { credit_count: 1, error_code: 0 } };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(responseHash(a)).toBe(responseHash(b));
  });

  it("changes when any value changes", () => {
    expect(responseHash({ price: 1 })).not.toBe(responseHash({ price: 1.0001 }));
  });

  it("preserves array order and produces a sha-256 hex digest", () => {
    expect(responseHash([1, 2])).not.toBe(responseHash([2, 1]));
    expect(responseHash({})).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("makeReceipt", () => {
  it("marks live values verified and carries CMC metadata", () => {
    const r = makeReceipt(meta(), { label: "Average tokenized price", value: 236.5, rwaId: 9, field: "data.rwa_assets[0].average_tokenized_price" });
    expect(r).toMatchObject({
      source: "CoinMarketCap",
      endpoint: "/v5/real-world-assets/quotes/latest",
      value: 236.5,
      rwaId: 9,
      creditCount: 1,
      sourceTimestamp: "2026-09-29T18:02:39.000Z",
      verificationStatus: "verified",
    });
  });

  it("never claims verified for demo data", () => {
    expect(makeReceipt(meta("demo"), { label: "x", value: 1 }).verificationStatus).toBe("demo");
  });

  it("marks missing values unavailable instead of inventing them", () => {
    const r = makeReceipt(meta(), { label: "x", value: undefined });
    expect(r.value).toBeNull();
    expect(r.verificationStatus).toBe("unavailable");
  });

  it("prefers the record timestamp over status.timestamp", () => {
    expect(makeReceipt(meta(), { label: "x", value: 1, sourceTimestamp: "2026-09-29T18:00:00Z" }).sourceTimestamp).toBe(
      "2026-09-29T18:00:00Z"
    );
  });
});
