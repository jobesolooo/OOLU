import "server-only";
import type Stripe from "stripe";
import { getBusiness } from "./business";

type Country = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;

/** Shipping rules, edited in Admin → Settings → Business details. */
export async function shippingConfig() {
  const b = await getBusiness();
  return { freeShippingThreshold: b.freeShippingThreshold, flatRate: b.flatRate, countries: b.countries as Country[] };
}
