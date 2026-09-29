import { createHash } from "node:crypto";
import type { EvidenceReceipt, ResponseMeta } from "./types";

/**
 * Canonical JSON: object keys sorted recursively, so the same response always
 * serialises to the same string regardless of key order.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

/** SHA-256 response integrity fingerprint of a JSON payload. */
export function responseHash(payload: unknown): string {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

type ReceiptValue = EvidenceReceipt["value"];

function toReceiptValue(v: unknown): ReceiptValue {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  return JSON.stringify(v);
}

/**
 * Build a receipt for one value extracted from one CMC response.
 * A missing value yields status "unavailable" — never a fabricated number.
 */
export function makeReceipt(
  meta: ResponseMeta,
  opts: {
    label: string;
    field?: string;
    value: unknown;
    rwaId?: number;
    identifier?: { type: string; value: string };
    sourceTimestamp?: string | null;
  }
): EvidenceReceipt {
  const value = toReceiptValue(opts.value);
  const status: EvidenceReceipt["verificationStatus"] =
    value === null ? "unavailable" : meta.mode === "demo" ? "demo" : "verified";
  return {
    source: "CoinMarketCap",
    endpoint: meta.endpoint,
    params: meta.params,
    identifier: opts.identifier,
    rwaId: opts.rwaId,
    label: opts.label,
    field: opts.field,
    value,
    retrievedAt: meta.retrievedAt,
    sourceTimestamp: opts.sourceTimestamp ?? meta.sourceTimestamp,
    creditCount: meta.creditCount,
    elapsedMs: meta.elapsedMs,
    responseHash: meta.responseHash,
    verificationStatus: status,
    mode: meta.mode,
  };
}
