import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "./db";
import type { Address } from "./db/schema";
import { getStripe, isStripeConfigured } from "./stripe";
import { shippingConfig } from "./shipping";

/* ── Addresses ───────────────────────────────────────────── */
export const AddressInput = z.object({
  label: z.string().trim().max(40).optional().transform((v) => v || null),
  name: z.string().trim().min(1, "Enter the recipient's name").max(80),
  line1: z.string().trim().min(1, "Enter the street and number").max(120),
  line2: z.string().trim().max(120).optional().transform((v) => v || null),
  postalCode: z.string().trim().min(1, "Enter the postcode").max(20),
  city: z.string().trim().min(1, "Enter the city").max(80),
  region: z.string().trim().max(80).optional().transform((v) => v || null),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => (shippingConfig().countries as string[]).includes(c), "We don't ship to that country yet"),
  phone: z.string().trim().max(30).optional().transform((v) => v || null),
  isDefault: z.string().optional().transform((v) => v === "on" || v === "true"),
});
export type AddressFields = z.infer<typeof AddressInput>;

export async function listAddresses(userId: string) {
  const db = await getDb();
  return db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId)).orderBy(desc(schema.addresses.isDefault), asc(schema.addresses.createdAt));
}

export async function getAddress(userId: string, id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.addresses).where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.id, id))).limit(1);
  return row ?? null;
}

/** Create or update; the first address (or one marked default) becomes the default. */
export async function saveAddress(userId: string, fields: AddressFields, id?: string) {
  const db = await getDb();
  const existing = await listAddresses(userId);
  const makeDefault = fields.isDefault || existing.length === 0 || (id && existing.length === 1);
  let row: Address;
  if (id) {
    if (!existing.some((a) => a.id === id)) throw new Error("Address not found");
    [row] = await db
      .update(schema.addresses)
      .set({ ...fields, isDefault: Boolean(makeDefault) || existing.find((a) => a.id === id)!.isDefault, updatedAt: new Date() })
      .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)))
      .returning();
  } else {
    [row] = await db
      .insert(schema.addresses)
      .values({ ...fields, userId, isDefault: Boolean(makeDefault) })
      .returning();
  }
  if (row.isDefault) await setDefaultAddress(userId, row.id);
  return row;
}

export async function setDefaultAddress(userId: string, id: string) {
  const db = await getDb();
  await db.update(schema.addresses).set({ isDefault: false }).where(and(eq(schema.addresses.userId, userId), ne(schema.addresses.id, id)));
  const [row] = await db
    .update(schema.addresses)
    .set({ isDefault: true })
    .where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.id, id)))
    .returning();
  if (row) await syncShippingToStripe(userId, row);
}

export async function deleteAddress(userId: string, id: string) {
  const db = await getDb();
  const [gone] = await db.delete(schema.addresses).where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.id, id))).returning();
  // Keep a default when one was removed.
  if (gone?.isDefault) {
    const [next] = await listAddresses(userId);
    if (next) await setDefaultAddress(userId, next.id);
    else await syncShippingToStripe(userId, null);
  }
}

export async function defaultAddress(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.addresses)
    .where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.isDefault, true)))
    .limit(1);
  return row ?? null;
}

/** Stripe Checkout fills in the customer's saved shipping address, so keep it on the default. */
export async function syncShippingToStripe(userId: string, address: Address | null) {
  if (!isStripeConfigured()) return;
  const db = await getDb();
  const [u] = await db.select({ customer: schema.users.stripeCustomerId }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!u?.customer) return;
  try {
    await getStripe().customers.update(u.customer, {
      shipping: address
        ? {
            name: address.name,
            phone: address.phone ?? undefined,
            address: {
              line1: address.line1,
              line2: address.line2 ?? undefined,
              postal_code: address.postalCode,
              city: address.city,
              state: address.region ?? undefined,
              country: address.country,
            },
          }
        : "",
    });
  } catch (err) {
    console.error("[account] couldn't update Stripe shipping", err);
  }
}

/* ── Reviews ─────────────────────────────────────────────── */
export async function listUserReviews(userId: string) {
  const db = await getDb();
  return db.select().from(schema.reviews).where(eq(schema.reviews.userId, userId)).orderBy(desc(schema.reviews.createdAt));
}

/* ── Data export (GDPR: a copy of everything we hold about you) ── */
export async function exportUserData(userId: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) return null;
  const [addresses, orders, reviews, wishlist, logins, subs] = await Promise.all([
    listAddresses(userId),
    db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt)),
    listUserReviews(userId),
    db.select().from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, userId)),
    db.select({ provider: schema.oauthAccounts.provider, createdAt: schema.oauthAccounts.createdAt }).from(schema.oauthAccounts).where(eq(schema.oauthAccounts.userId, userId)),
    db.select().from(schema.subscribers).where(eq(schema.subscribers.email, user.email)),
  ]);
  const items = orders.length
    ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    : [];
  const strip = <T extends object>(o: T, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
  return {
    exportedAt: new Date().toISOString(),
    profile: strip(user, ["passwordHash", "sessionVersion", "stripeCustomerId"]),
    signInMethods: [...(user.passwordHash ? [{ provider: "email" }] : []), ...logins],
    addresses: addresses.map((a) => strip(a, ["userId"])),
    orders: orders.map((o) => ({ ...strip(o, ["userId", "stripeSessionId", "stripePaymentIntentId"]), items: items.filter((i) => i.orderId === o.id).map((i) => strip(i, ["orderId"])) })),
    reviews: reviews.map((r) => strip(r, ["userId"])),
    wishlist: wishlist.map((w) => ({ productId: w.productId, savedAt: w.createdAt })),
    newsletter: subs.map((s) => strip(s, ["id"])),
  };
}

/** Full profile row for the account pages (getCurrentUser only carries the basics). */
export async function getProfile(userId: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return row ?? null;
}

/** Country options for the address form: the countries we ship to, named in the visitor's language. */
export function shippingCountries(locale: string) {
  const names = new Intl.DisplayNames([locale, "en"], { type: "region" });
  return (shippingConfig().countries as string[])
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
