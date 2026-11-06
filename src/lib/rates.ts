import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { CURRENCIES, CURRENCY_COOKIE, FALLBACK_RATES, formatDisplay, isCurrency, type CurrencyCode, type Rates } from "./currency";

/**
 * Daily exchange rates (EUR base) from open.er-api.com — free, no key.
 * Cached for 12 hours; falls back to built-in rates if the service is down.
 */
export const getRates = cache(async (): Promise<Rates> => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR", { next: { revalidate: 43_200 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rates: Rates = { EUR: 1 };
    for (const c of CURRENCIES) {
      const r = data.rates?.[c.code];
      rates[c.code] = typeof r === "number" && r > 0 ? r : FALLBACK_RATES[c.code];
    }
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
});

export const getCurrency = cache(async (): Promise<CurrencyCode> => {
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(c) ? c : "EUR";
});

/** Server-side formatter in the shopper's display currency. */
export async function getMoney() {
  const [currency, rates] = await Promise.all([getCurrency(), getRates()]);
  return {
    currency,
    rates,
    money: (cents: number, from = "EUR", short = false) => formatDisplay(cents, from, currency, rates, { short }),
  };
}
