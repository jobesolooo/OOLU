import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local (see .env.example).");
  }
  if (!client) {
    client = new Stripe(key, { appInfo: { name: "OOLU storefront" } });
  }
  return client;
}

export function stripeDashboardUrl(path: string) {
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live");
  return `https://dashboard.stripe.com/${live ? "" : "test/"}${path.replace(/^\//, "")}`;
}
