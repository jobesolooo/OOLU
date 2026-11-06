/**
 * Display currencies. The store prices and charges in EUR; other currencies are
 * converted for display only (shown with "≈"). Rates come from lib/rates.ts.
 */
export const BASE_CURRENCY = "EUR";
export const CURRENCY_COOKIE = "oolu_currency";

/**
 * Symbol and separators are spelled out (not taken from Intl) so the server and
 * every browser render exactly the same text. Intl's currency data differs between
 * Node and browser versions (e.g. "GH₵" vs "GHS"), which breaks hydration.
 */
export const CURRENCIES = [
  { code: "EUR", name: "Euro", locale: "nl-NL", decimals: 2, symbol: "€", before: true, space: false, group: ".", decimal: "," },
  { code: "USD", name: "US dollar", locale: "en-US", decimals: 2, symbol: "$", before: true, space: false, group: ",", decimal: "." },
  { code: "GBP", name: "British pound", locale: "en-GB", decimals: 2, symbol: "£", before: true, space: false, group: ",", decimal: "." },
  { code: "CHF", name: "Swiss franc", locale: "de-CH", decimals: 2, symbol: "CHF", before: true, space: true, group: "'", decimal: "." },
  { code: "SEK", name: "Swedish krona", locale: "sv-SE", decimals: 0, symbol: "kr", before: false, space: true, group: " ", decimal: "," },
  { code: "DKK", name: "Danish krone", locale: "da-DK", decimals: 0, symbol: "kr.", before: false, space: true, group: ".", decimal: "," },
  { code: "NOK", name: "Norwegian krone", locale: "nb-NO", decimals: 0, symbol: "kr", before: false, space: true, group: " ", decimal: "," },
  { code: "PLN", name: "Polish złoty", locale: "pl-PL", decimals: 2, symbol: "zł", before: false, space: true, group: " ", decimal: "," },
  { code: "NGN", name: "Nigerian naira", locale: "en-NG", decimals: 0, symbol: "₦", before: true, space: false, group: ",", decimal: "." },
  { code: "GHS", name: "Ghanaian cedi", locale: "en-GH", decimals: 2, symbol: "GH₵", before: true, space: false, group: ",", decimal: "." },
  { code: "KES", name: "Kenyan shilling", locale: "en-KE", decimals: 0, symbol: "KSh", before: true, space: true, group: ",", decimal: "." },
  { code: "ZAR", name: "South African rand", locale: "en-ZA", decimals: 2, symbol: "R", before: true, space: false, group: " ", decimal: "," },
] as const;

type CurrencySpec = (typeof CURRENCIES)[number];

/** Deterministic money text, e.g. €1.234,50 · $1,234.50 · 1 234 kr · GH₵1,234.50 */
export function formatWith(spec: Pick<CurrencySpec, "symbol" | "before" | "space" | "group" | "decimal">, value: number, decimals: number) {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, frac] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, spec.group);
  const num = frac ? `${grouped}${spec.decimal}${frac}` : grouped;
  const gap = spec.space ? " " : "";
  const out = spec.before ? `${spec.symbol}${gap}${num}` : `${num}${gap}${spec.symbol}`;
  return negative ? `-${out}` : out;
}

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type Rates = Record<string, number>; // units of currency per 1 EUR

/** Used when the live rate service can't be reached (approx. Nov 2026). */
export const FALLBACK_RATES: Rates = {
  EUR: 1,
  USD: 1.123,
  GBP: 0.834,
  CHF: 0.916,
  SEK: 11.0,
  DKK: 7.475,
  NOK: 10.44,
  PLN: 4.395,
  NGN: 1500.6,
  GHS: 13.15,
  KES: 146.0,
  ZAR: 18.46,
};

export const isCurrency = (c: string | undefined | null): c is CurrencyCode => CURRENCIES.some((x) => x.code === c);

const info = (code: string) => CURRENCIES.find((c) => c.code === code.toUpperCase());

/** Convert minor units (cents) between currencies via EUR. */
export function convert(cents: number, from: string, to: string, rates: Rates) {
  const f = rates[from.toUpperCase()] ?? 1;
  const t = rates[to.toUpperCase()] ?? 1;
  return (cents / f) * t;
}

/**
 * Format an amount for the shopper's chosen display currency.
 * EUR keeps the brand style (€29,00); others use the currency's own locale and
 * get a leading "≈" because they're estimates (payment is in EUR).
 */
export function formatDisplay(
  cents: number,
  from: string,
  to: string,
  rates: Rates,
  opts: { approx?: boolean; short?: boolean } = {},
) {
  const target = info(to) ?? info(BASE_CURRENCY)!;
  if (target.code === from.toUpperCase() && target.code === BASE_CURRENCY) {
    const s = formatWith(target, cents / 100, 2);
    return opts.short ? s.replace(/,00$/, "") : s;
  }
  const value = convert(cents, from, target.code, rates) / 100;
  const decimals = opts.short ? 0 : target.decimals;
  const s = formatWith(target, decimals === 0 ? Math.round(value) : value, decimals);
  return (opts.approx ?? true) ? `≈ ${s}` : s;
}
