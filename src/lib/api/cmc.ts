import "server-only";
import { responseHash } from "@/lib/receipt";
import type { ResponseMeta } from "@/lib/types";
import type { CmcEnvelope } from "./cmc-types";

/**
 * The single CoinMarketCap Pro API client. Server-only: the API key never
 * leaves this module and is never logged.
 */

const DEFAULT_BASE = "https://pro-api.coinmarketcap.com";
const TIMEOUT_MS = 7_000;
const MAX_ATTEMPTS = 2;

export type CmcErrorKind =
  | "missing_key"
  | "invalid_key"
  | "forbidden"
  | "rate_limited"
  | "not_found"
  | "bad_request"
  | "timeout"
  | "unavailable"
  | "malformed";

export class CmcError extends Error {
  constructor(
    readonly kind: CmcErrorKind,
    message: string,
    readonly endpoint: string,
    readonly httpStatus?: number
  ) {
    super(message);
    this.name = "CmcError";
  }
}

export function hasCmcKey(): boolean {
  return Boolean(process.env.CMC_API_KEY?.trim());
}

function baseUrl(): string {
  return process.env.CMC_API_BASE_URL?.trim() || DEFAULT_BASE;
}

export interface CmcResult<T> {
  data: T;
  meta: ResponseMeta;
}

interface FetchOpts {
  /** Next.js data-cache revalidation in seconds. */
  revalidate: number;
  /** Fall back to CMC's keyless /public-api prefix when no key is configured. */
  keyless?: boolean;
}

/** Maps HTTP status or CMC status.error_code (1001 invalid key … 1011 rate limits) to an error kind. */
function kindForHttp(status: number): CmcErrorKind {
  if (status === 401 || status === 1001 || status === 1002) return "invalid_key";
  if (status >= 1005 && status <= 1007) return "forbidden";
  if (status >= 1008 && status <= 1011) return "rate_limited";
  if (status === 402 || status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 400) return "bad_request";
  return "unavailable";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a CMC endpoint. Retries transient failures (timeouts, 5xx, 429) with
 * exponential backoff, at most MAX_ATTEMPTS times. Honors status.error_code.
 */
export async function cmcGet<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
  opts: FetchOpts
): Promise<CmcResult<T>> {
  const key = process.env.CMC_API_KEY?.trim();
  const useKeyless = !key && opts.keyless;
  if (!key && !useKeyless) {
    throw new CmcError("missing_key", "CMC_API_KEY is not configured", endpoint);
  }

  const clean = Object.fromEntries(
    Object.entries(params).filter((e): e is [string, string] => e[1] != null && e[1] !== "")
  );
  const path = useKeyless ? `/public-api${endpoint}` : endpoint;
  const url = `${baseUrl()}${path}${Object.keys(clean).length ? `?${new URLSearchParams(clean)}` : ""}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (key) headers["X-CMC_PRO_API_KEY"] = key;

  let lastError: CmcError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: opts.revalidate },
      });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      lastError = new CmcError(timedOut ? "timeout" : "unavailable", timedOut ? "CMC request timed out" : "Could not reach CMC", endpoint);
      console.warn(`[cmc] ${endpoint} attempt ${attempt} failed: ${lastError.kind}`);
      if (attempt < MAX_ATTEMPTS) await sleep(300 * 2 ** (attempt - 1));
      continue;
    }

    let body: CmcEnvelope<T> | null = null;
    try {
      body = (await res.json()) as CmcEnvelope<T>;
    } catch {
      body = null;
    }

    const code = Number(body?.status?.error_code ?? 0);
    if (!res.ok || code !== 0) {
      const httpStatus = res.ok ? code : res.status;
      const kind = kindForHttp(httpStatus);
      const message = body?.status?.error_message || `CMC responded with HTTP ${res.status}`;
      lastError = new CmcError(kind, message, endpoint, httpStatus);
      console.warn(`[cmc] ${endpoint} → ${httpStatus} ${kind}`);
      const transient = kind === "rate_limited" || kind === "unavailable";
      if (transient && attempt < MAX_ATTEMPTS) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 500 * 2 ** (attempt - 1));
        continue;
      }
      throw lastError;
    }

    if (!body || body.data == null) {
      throw new CmcError("malformed", "CMC response had no data", endpoint, res.status);
    }

    const status = body.status ?? {};
    return {
      data: body.data,
      meta: {
        endpoint,
        params: clean,
        retrievedAt: new Date().toISOString(),
        sourceTimestamp: status.timestamp ?? undefined,
        creditCount: typeof status.credit_count === "number" ? status.credit_count : undefined,
        elapsedMs: typeof status.elapsed === "number" ? status.elapsed : undefined,
        notice: status.notice ?? undefined,
        responseHash: responseHash(body),
        mode: "live",
      },
    };
  }

  throw lastError ?? new CmcError("unavailable", "CMC request failed", endpoint);
}

/** Wrap a fixture payload in the same metadata shape, clearly marked demo. */
export function demoResult<T>(endpoint: string, params: Record<string, string>, data: T): CmcResult<T> {
  return {
    data,
    meta: {
      endpoint,
      params,
      retrievedAt: new Date().toISOString(),
      responseHash: responseHash({ data, status: { demo: true } }),
      mode: "demo",
    },
  };
}

/** User-facing copy for each error kind. */
export function describeCmcError(err: unknown): { title: string; detail: string; kind: CmcErrorKind } {
  const kind: CmcErrorKind = err instanceof CmcError ? err.kind : "unavailable";
  const copy: Record<CmcErrorKind, [string, string]> = {
    missing_key: ["CMC API key not configured", "Set CMC_API_KEY on the server to load live CoinMarketCap data."],
    invalid_key: ["CMC rejected the API key", "Check that CMC_API_KEY is a valid Pro API key."],
    forbidden: ["Not available on this CMC plan", "This endpoint is not included in the configured API plan."],
    rate_limited: ["CMC rate limit reached", "Too many requests in a short window. Try again in a minute."],
    not_found: ["Not found in CMC data", "CMC returned no record for this identifier."],
    bad_request: ["CMC couldn't process this request", "The identifier may be invalid."],
    timeout: ["CMC took too long to respond", "The request timed out. Try again."],
    unavailable: ["CMC couldn't return this data right now", "The API is unreachable or returned an error."],
    malformed: ["Unexpected CMC response", "The response did not match the documented shape."],
  };
  const [title, detail] = copy[kind];
  return { title, detail, kind };
}
