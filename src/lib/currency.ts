export const SUPPORTED_CURRENCIES = ["usd", "eur", "inr"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const isCurrency = (v: unknown): v is Currency =>
  typeof v === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(v);
