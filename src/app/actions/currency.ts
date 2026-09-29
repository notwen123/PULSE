"use server";

import { cookies } from "next/headers";
import { isCurrency, type Currency } from "@/lib/currency";

const CURRENCY_COOKIE = "currency";

/** Persist the display currency in a cookie so server-rendered CMC calls can use it. */
export async function setCurrency(value: Currency): Promise<void> {
  if (!isCurrency(value)) return;
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function getCurrency(): Promise<Currency> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : "usd";
}
