import "server-only";
import { and, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { createAuthToken, linkGuestOrders } from "./auth";
import { sendAccountInvite, sendPasswordReset, sendVerifyEmail } from "./email";
import { getStripe, isStripeConfigured } from "./stripe";
import { staffEmail } from "./admin-auth";

/**
 * Staff tools for customer accounts. Accounts live in the store database;
 * when a customer also exists in Stripe (created at their first checkout),
 * name and email changes are copied there too.
 */

const PAID = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded"] as const;

export type AccountFilter = "accounts" | "staff";

export async function listAccounts(filter: AccountFilter, q: string) {
  const db = await getDb();
  const search = q ? or(ilike(schema.users.email, `%${q}%`), ilike(schema.users.name, `%${q}%`)) : undefined;
  const users = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, filter === "staff" ? "admin" : "customer"), search))
    .orderBy(desc(schema.users.createdAt))
    .limit(300);
  const ids = users.map((u) => u.id);
  const [stats, logins] = ids.length
    ? await Promise.all([
        db
          .select({
            userId: schema.orders.userId,
            orders: sql<number>`count(*)::int`,
            spent: sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}),0)::int`,
            last: sql<string>`max(${schema.orders.paidAt})`,
          })
          .from(schema.orders)
          .where(and(inArray(schema.orders.userId, ids), inArray(schema.orders.status, [...PAID])))
          .groupBy(schema.orders.userId),
        db.select().from(schema.oauthAccounts).where(inArray(schema.oauthAccounts.userId, ids)),
      ])
    : [[], []];
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  return users.map((u) => ({
    ...u,
    orders: byUser.get(u.id)?.orders ?? 0,
    spent: byUser.get(u.id)?.spent ?? 0,
    lastOrder: byUser.get(u.id)?.last ?? null,
    methods: [u.passwordHash && "Email", ...logins.filter((l) => l.userId === u.id).map((l) => (l.provider === "google" ? "Google" : "Apple"))].filter(Boolean) as string[],
  }));
}

/** People who ordered without an account, grouped by email. */
export async function listGuests(q: string) {
  const db = await getDb();
  return db
    .select({
      email: schema.orders.email,
      name: sql<string | null>`max(${schema.orders.shippingAddress}->>'name')`,
      orders: sql<number>`count(*)::int`,
      spent: sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}),0)::int`,
      last: sql<string>`max(${schema.orders.paidAt})`,
    })
    .from(schema.orders)
    .where(and(isNull(schema.orders.userId), inArray(schema.orders.status, [...PAID]), sql`${schema.orders.email} is not null`, q ? ilike(schema.orders.email, `%${q}%`) : undefined))
    .groupBy(schema.orders.email)
    .orderBy(desc(sql`max(${schema.orders.paidAt})`))
    .limit(300);
}

export async function accountCounts() {
  const db = await getDb();
  const [[a], [s], [g]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, "customer")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, "admin")),
    db
      .select({ n: sql<number>`count(distinct ${schema.orders.email})::int` })
      .from(schema.orders)
      .where(and(isNull(schema.orders.userId), inArray(schema.orders.status, [...PAID]))),
  ]);
  return { accounts: a.n, staff: s.n, guests: g.n };
}

export async function getAccount(id: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!user) return null;
  const [orders, reviews, logins, [sub], [wish]] = await Promise.all([
    db.select().from(schema.orders).where(and(eq(schema.orders.userId, id), ne(schema.orders.status, "pending"))).orderBy(desc(schema.orders.createdAt)).limit(50),
    db.select().from(schema.reviews).where(eq(schema.reviews.userId, id)).orderBy(desc(schema.reviews.createdAt)).limit(20),
    db.select().from(schema.oauthAccounts).where(eq(schema.oauthAccounts.userId, id)),
    db.select().from(schema.subscribers).where(eq(schema.subscribers.email, user.email)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, id)),
  ]);
  return { user, orders, reviews, logins, subscribed: Boolean(sub && !sub.unsubscribedAt), wishlist: wish.n };
}

export const isProtectedStaff = (email: string) => email.toLowerCase() === staffEmail().toLowerCase();

export async function emailTaken(email: string, exceptId?: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, email.toLowerCase()), exceptId ? ne(schema.users.id, exceptId) : undefined))
    .limit(1);
  return Boolean(row);
}

async function syncStripeCustomer(stripeCustomerId: string | null, d: { email: string; name: string | null }) {
  if (!stripeCustomerId || !isStripeConfigured()) return;
  try {
    await getStripe().customers.update(stripeCustomerId, { email: d.email, name: d.name ?? "" });
  } catch (err) {
    console.error("[admin-users] Stripe customer update failed", err);
  }
}

export async function createAccount(d: { email: string; name: string | null; verified: boolean; invite: boolean; staff: boolean }) {
  const db = await getDb();
  const [user] = await db
    .insert(schema.users)
    .values({
      email: d.email.toLowerCase(),
      name: d.name,
      role: d.staff ? "admin" : "customer",
      emailVerifiedAt: d.verified ? new Date() : null,
    })
    .returning();
  if (d.verified) await linkGuestOrders(user.id, user.email);
  let invited = false;
  if (d.invite) {
    try {
      await sendAccountInvite(user.email, user.name, await createAuthToken(user.id, "reset_password", 7 * 24 * 60));
      invited = true;
    } catch (err) {
      // The account still exists; staff can resend from the account page.
      console.error("[admin-users] invite email failed", err);
    }
  }
  return { user, invited };
}

export async function updateAccount(id: string, d: { email: string; name: string | null; verified: boolean; staff: boolean }) {
  const db = await getDb();
  const [before] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!before) throw new Error("Account not found");
  const emailChanged = before.email !== d.email.toLowerCase();
  const [user] = await db
    .update(schema.users)
    .set({
      email: d.email.toLowerCase(),
      name: d.name,
      role: isProtectedStaff(before.email) ? "admin" : d.staff ? "admin" : "customer",
      emailVerifiedAt: d.verified ? (emailChanged ? new Date() : (before.emailVerifiedAt ?? new Date())) : null,
      // Staff access changing or a new email signs the person out everywhere.
      ...(emailChanged || before.role !== (d.staff ? "admin" : "customer") ? { sessionVersion: before.sessionVersion + 1 } : {}),
    })
    .where(eq(schema.users.id, id))
    .returning();
  if (d.verified && !before.emailVerifiedAt) await linkGuestOrders(user.id, user.email);
  await syncStripeCustomer(user.stripeCustomerId, user);
  return user;
}

export async function sendReset(id: string) {
  const { user } = (await getAccount(id)) ?? {};
  if (!user) throw new Error("Account not found");
  await sendPasswordReset(user.email, await createAuthToken(user.id, "reset_password", 60));
}

export async function sendVerification(id: string) {
  const { user } = (await getAccount(id)) ?? {};
  if (!user) throw new Error("Account not found");
  await sendVerifyEmail(user.email, await createAuthToken(user.id, "verify_email", 24 * 60));
}

export async function signOutEverywhere(id: string) {
  const db = await getDb();
  await db.update(schema.users).set({ sessionVersion: sql`${schema.users.sessionVersion} + 1` }).where(eq(schema.users.id, id));
}

export async function setSubscribed(email: string, on: boolean) {
  const db = await getDb();
  if (on) {
    await db
      .insert(schema.subscribers)
      .values({ email: email.toLowerCase(), source: "admin" })
      .onConflictDoUpdate({ target: schema.subscribers.email, set: { unsubscribedAt: null } });
  } else {
    await db.update(schema.subscribers).set({ unsubscribedAt: new Date() }).where(eq(schema.subscribers.email, email.toLowerCase()));
  }
}

/** Delete an account. Orders are kept (as guest orders) for the books; reviews stay, without the link. */
export async function deleteAccount(id: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!user) return;
  if (isProtectedStaff(user.email)) throw new Error("The main staff account can't be deleted.");
  await db.delete(schema.users).where(eq(schema.users.id, id));
}
