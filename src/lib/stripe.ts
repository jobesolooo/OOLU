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
    // STRIPE_MOCK_URL (e.g. http://localhost:12111) points the client at stripe-mock for local testing.
    const mock = process.env.STRIPE_MOCK_URL ? new URL(process.env.STRIPE_MOCK_URL) : null;
    client = new Stripe(key, {
      appInfo: { name: "OOLU storefront" },
      ...(mock ? { host: mock.hostname, port: Number(mock.port), protocol: mock.protocol.replace(":", "") as "http" | "https" } : {}),
    });
  }
  return client;
}

export function stripeDashboardUrl(path: string) {
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live");
  return `https://dashboard.stripe.com/${live ? "" : "test/"}${path.replace(/^\//, "")}`;
}
