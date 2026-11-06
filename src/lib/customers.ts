import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getStripe } from "./stripe";
import type { CurrentUser } from "./auth";

/** Returns the user's Stripe customer id, creating one on first checkout. */
export async function ensureStripeCustomer(user: CurrentUser) {
  const db = await getDb();
  const [row] = await db.select({ id: schema.users.stripeCustomerId }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (row?.id) return row.id;
  try {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    await db.update(schema.users).set({ stripeCustomerId: customer.id }).where(eq(schema.users.id, user.id));
    return customer.id;
  } catch (err) {
    console.error("[customers] could not create Stripe customer", err);
    return null;
  }
}
