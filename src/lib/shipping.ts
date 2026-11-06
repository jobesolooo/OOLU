import type Stripe from "stripe";

const DEFAULT_COUNTRIES = [
  "US", "CA", "GB", "IE", "NL", "BE", "DE", "FR", "ES", "IT", "PT", "AT", "CH", "DK", "SE", "NO", "FI",
  "PL", "CZ", "LU", "AU", "NZ", "JP", "SG", "AE",
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export function shippingConfig() {
  const threshold = Number(process.env.FREE_SHIPPING_THRESHOLD ?? 10000);
  const flat = Number(process.env.FLAT_SHIPPING_RATE ?? 800);
  const countries = (process.env.SHIPPING_COUNTRIES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
  return {
    freeShippingThreshold: Number.isFinite(threshold) ? threshold : 10000,
    flatRate: Number.isFinite(flat) ? flat : 800,
    countries: countries.length ? countries : DEFAULT_COUNTRIES,
  };
}
