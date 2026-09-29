import "server-only";
import { NextResponse } from "next/server";
import { CmcError, describeCmcError } from "./cmc";

const STATUS: Record<string, number> = {
  missing_key: 503,
  invalid_key: 502,
  forbidden: 502,
  rate_limited: 429,
  not_found: 404,
  bad_request: 400,
  timeout: 504,
  unavailable: 502,
  malformed: 502,
};

/** Structured JSON error. Never includes secrets or upstream bodies. */
export function jsonError(err: unknown) {
  const { title, detail, kind } = describeCmcError(err);
  const endpoint = err instanceof CmcError ? err.endpoint : undefined;
  const message = err instanceof CmcError ? err.message : undefined;
  return NextResponse.json({ error: { kind, title, detail, message, endpoint } }, { status: STATUS[kind] ?? 500 });
}

export function parseRwaIds(raw: string | null, max = 50): number[] | null {
  if (!raw || !/^\d+(,\d+)*$/.test(raw)) return null;
  const ids = [...new Set(raw.split(",").map(Number))].filter((n) => n > 0);
  return ids.length && ids.length <= max ? ids : null;
}

export const badRequest = (message: string) =>
  NextResponse.json({ error: { kind: "bad_request", title: "Invalid request", detail: message } }, { status: 400 });
