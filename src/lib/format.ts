/** Store currency. OOLU sells in euros; override with NEXT_PUBLIC_STORE_CURRENCY. */
export const DEFAULT_CURRENCY = (process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "eur").toLowerCase();

/** Dutch-style money like the OOLU shop: €29,00 */
export function formatMoney(cents: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  })
    .format(cents / 100)
    .replace(/\u00a0/g, "");
}

/** Short form: drops ",00" on whole amounts (€150). */
export function formatMoneyShort(cents: number, currency = DEFAULT_CURRENCY) {
  return formatMoney(cents, currency).replace(/,00$/, "");
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(d));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
