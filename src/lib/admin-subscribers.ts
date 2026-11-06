import "server-only";
import { and, desc, eq, ilike, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { createWelcomeCode } from "./promotions";
import { sendNewsletterWelcome } from "./email";
import { getSettings } from "./settings";
import { getProducts } from "./catalog";

export type SubscriberView = "active" | "unsubscribed";

export async function listSubscribers(view: SubscriberView, q: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.subscribers)
    .where(and(view === "active" ? isNull(schema.subscribers.unsubscribedAt) : isNotNull(schema.subscribers.unsubscribedAt), q ? ilike(schema.subscribers.email, `%${q}%`) : undefined))
    .orderBy(desc(schema.subscribers.createdAt))
    .limit(1000);
  // Link subscribers who also have an account.
  const accounts = rows.length
    ? await db
        .select({ id: schema.users.id, email: schema.users.email })
        .from(schema.users)
        .where(inArray(schema.users.email, rows.map((r) => r.email)))
    : [];
  const byEmail = new Map(accounts.map((a) => [a.email, a.id]));
  return rows.map((r) => ({ ...r, accountId: byEmail.get(r.email) ?? null }));
}

export async function listAlerts(q: string) {
  const db = await getDb();
  const [rows, products] = await Promise.all([
    db
      .select()
      .from(schema.stockAlerts)
      .where(and(isNull(schema.stockAlerts.notifiedAt), q ? ilike(schema.stockAlerts.email, `%${q}%`) : undefined))
      .orderBy(desc(schema.stockAlerts.createdAt))
      .limit(1000),
    getProducts(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, product: byId.get(r.productId) ?? null }));
}

export async function subscriberCounts() {
  const db = await getDb();
  const n = sql<number>`count(*)::int`;
  const [[a], [u], [al]] = await Promise.all([
    db.select({ n }).from(schema.subscribers).where(isNull(schema.subscribers.unsubscribedAt)),
    db.select({ n }).from(schema.subscribers).where(isNotNull(schema.subscribers.unsubscribedAt)),
    db.select({ n }).from(schema.stockAlerts).where(isNull(schema.stockAlerts.notifiedAt)),
  ]);
  return { active: a.n, unsubscribed: u.n, alerts: al.n };
}

/**
 * Add (or re-subscribe) one email. New subscribers can get the same personal
 * welcome code and email as people who sign up on the site.
 */
export async function addSubscriber(email: string, opts: { welcome: boolean; source?: string }) {
  const db = await getDb();
  const clean = email.trim().toLowerCase();
  const [existing] = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, clean)).limit(1);
  if (existing && !existing.unsubscribedAt) return "exists" as const;
  if (existing) {
    await db.update(schema.subscribers).set({ unsubscribedAt: null }).where(eq(schema.subscribers.id, existing.id));
    return "resubscribed" as const;
  }
  let code: string | null = null;
  const { popup } = await getSettings();
  if (opts.welcome) {
    try {
      code = await createWelcomeCode(clean, popup.percentOff);
    } catch (err) {
      console.error("[subscribers] welcome code failed", err);
    }
  }
  await db.insert(schema.subscribers).values({ email: clean, promoCode: code, source: opts.source ?? "admin" });
  if (opts.welcome) await sendNewsletterWelcome(clean, code, popup.percentOff).catch((err) => console.error("[subscribers] welcome email failed", err));
  return "added" as const;
}

export async function updateSubscriberEmail(id: string, email: string) {
  const db = await getDb();
  const clean = email.trim().toLowerCase();
  const [clash] = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(and(eq(schema.subscribers.email, clean), ne(schema.subscribers.id, id)))
    .limit(1);
  if (clash) throw new Error("That email is already on the list.");
  await db.update(schema.subscribers).set({ email: clean }).where(eq(schema.subscribers.id, id));
}

export async function setSubscriberActive(id: string, active: boolean) {
  const db = await getDb();
  await db.update(schema.subscribers).set({ unsubscribedAt: active ? null : new Date() }).where(eq(schema.subscribers.id, id));
}

export async function deleteSubscriber(id: string) {
  const db = await getDb();
  await db.delete(schema.subscribers).where(eq(schema.subscribers.id, id));
}

export async function resendWelcome(id: string) {
  const db = await getDb();
  const [s] = await db.select().from(schema.subscribers).where(eq(schema.subscribers.id, id)).limit(1);
  if (!s) throw new Error("Subscriber not found");
  const { popup } = await getSettings();
  await sendNewsletterWelcome(s.email, s.promoCode, popup.percentOff);
}

export async function deleteAlert(id: string) {
  const db = await getDb();
  await db.delete(schema.stockAlerts).where(eq(schema.stockAlerts.id, id));
}
