/** Display formatting. Missing values render as an em dash, never as zero. */

const NA = "—";

export function formatMoney(value: number | null | undefined, currency = "USD"): string {
  if (value == null || !Number.isFinite(value)) return NA;
  const abs = Math.abs(value);
  const digits = abs >= 10 ? 2 : abs >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCompactMoney(value: number | null | undefined, currency = "USD"): string {
  if (value == null || !Number.isFinite(value)) return NA;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, { signed = false } = {}): string {
  if (value == null || !Number.isFinite(value)) return NA;
  const s = `${value.toFixed(2)}%`;
  return signed && value > 0 ? `+${s}` : s;
}

export function formatUtcTime(iso: string | null | undefined): string {
  if (!iso) return NA;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NA;
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)} UTC`;
}

export const ASSET_TYPE_LABEL: Record<string, string> = {
  stock: "Stock",
  commodity: "Commodity",
  currency: "Currency",
  government_security: "Government security",
  etf: "ETF",
  real_estate: "Real estate",
  unknown: "Real-world asset",
};

export const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

/**
 * CMC `about.description` can be Markdown with "### Question" sections and
 * [text](url) links. Split into titled sections and flatten links to text.
 */
export function parseAbout(raw: string | null): { title: string | null; body: string }[] {
  if (!raw) return [];
  const text = raw.replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, "$1").replace(/\*\*|__/g, "");
  const parts = text.split(/\s*#{2,4}\s+/).map((p) => p.trim()).filter(Boolean);
  return parts.map((p) => {
    const q = /^(.+?\?)\s+([\s\S]+)$/.exec(p);
    return q ? { title: q[1].trim(), body: q[2].trim() } : { title: null, body: p };
  });
}
