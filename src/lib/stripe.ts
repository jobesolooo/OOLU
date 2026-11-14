import "server-only";
import Stripe from "stripe";
import { getKey } from "./keys";

// One client per key, so a key changed in Admin → Settings is picked up on the next request.
const g = globalThis as unknown as { __oolu_stripe?: { key: string; client: Stripe } };

export async function isStripeConfigured() {
  return Boolean(await getKey("STRIPE_SECRET_KEY"));
}

export function stripeClient(key: string) {
  // STRIPE_MOCK_URL (e.g. http://localhost:12111) points the client at stripe-mock for local testing.
  const mock = process.env.STRIPE_MOCK_URL ? new URL(process.env.STRIPE_MOCK_URL) : null;
  return new Stripe(key, {
    appInfo: { name: "OOLU storefront" },
    ...(mock ? { host: mock.hostname, port: Number(mock.port), protocol: mock.protocol.replace(":", "") as "http" | "https" } : {}),
  });
}

export async function getStripe(): Promise<Stripe> {
  const key = await getKey("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe isn't connected. Add the secret key in Admin → Settings → Account keys.");
  if (g.__oolu_stripe?.key !== key) g.__oolu_stripe = { key, client: stripeClient(key) };
  return g.__oolu_stripe.client;
}

export async function stripeDashboardUrl(path: string) {
  const live = /^(sk|rk)_live/.test((await getKey("STRIPE_SECRET_KEY")) ?? "");
  return `https://dashboard.stripe.com/${live ? "" : "test/"}${path.replace(/^\//, "")}`;
}

/** Same as stripeDashboardUrl, for code that has already called getStripe() (uses that client's mode). */
export function stripeDashboardUrlSync(path: string) {
  const live = /^(sk|rk)_live/.test(g.__oolu_stripe?.key ?? "");
  return `https://dashboard.stripe.com/${live ? "" : "test/"}${path.replace(/^\//, "")}`;
}
