import "server-only";
import { and, eq, gte, isNotNull, like, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, schema, type DB } from "./db";
import { randomCode } from "./promotions";
import { sendGiftCardEmail } from "./email";
import { getStripe } from "./stripe";

export const GIFT_CARD_AMOUNTS = [2500, 5000, 10000, 15000, 25000];

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

export async function findActiveGiftCard(code: string) {
  const db = await getDb();
  const [card] = await db
    .select()
    .from(schema.giftCards)
    .where(and(eq(schema.giftCards.code, normalizeCode(code)), eq(schema.giftCards.status, "active")))
    .limit(1);
  return card ?? null;
}

export async function createPendingGiftCard(input: {
  amount: number;
  currency: string;
  recipientEmail: string | null;
  recipientName: string | null;
  senderName: string | null;
  message: string | null;
}) {
  const db = await getDb();
  const [card] = await db
    .insert(schema.giftCards)
    .values({
      code: randomCode("OOLU-", 4) + "-" + randomCode("", 4) + "-" + randomCode("", 4),
      initialAmount: input.amount,
      balance: 0,
      currency: input.currency,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      senderName: input.senderName,
      message: input.message,
      status: "pending",
    })
    .returning();
  return card;
}

export async function attachGiftCardSession(id: string, sessionId: string) {
  const db = await getDb();
  await db.update(schema.giftCards).set({ stripeSessionId: sessionId }).where(eq(schema.giftCards.id, id));
}

/** Webhook / success page: activate a purchased gift card (idempotent). */
export async function activatePurchasedGiftCard(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return null;
  const id = session.metadata?.giftCardId;
  if (!id) return null;
  const db = await getDb();
  const card = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.giftCards)
      .set({
        status: "active",
        balance: sql`${schema.giftCards.initialAmount}`,
        purchaserEmail: session.customer_details?.email ?? null,
        stripeSessionId: session.id,
      })
      .where(and(eq(schema.giftCards.id, id), eq(schema.giftCards.status, "pending")))
      .returning();
    if (!updated) return null;
    await tx.insert(schema.giftCardLedger).values({ giftCardId: id, amount: updated.initialAmount, note: "Purchased" });
    return updated;
  });
  if (card) await sendGiftCardEmail(card);
  return card;
}

/** Deduct gift card balance when an order is paid. Runs inside the order transaction. */
export async function redeemGiftCard(
  tx: DB | Parameters<Parameters<DB["transaction"]>[0]>[0],
  giftCardId: string,
  orderId: string,
  amount: number,
) {
  if (amount <= 0) return true;
  const [ok] = await tx
    .update(schema.giftCards)
    .set({ balance: sql`${schema.giftCards.balance} - ${amount}` })
    .where(and(eq(schema.giftCards.id, giftCardId), gte(schema.giftCards.balance, amount)))
    .returning({ id: schema.giftCards.id });
  if (!ok) {
    // Balance was spent elsewhere between checkout and payment. Take what's left and flag it.
    const [card] = await tx.select().from(schema.giftCards).where(eq(schema.giftCards.id, giftCardId)).limit(1);
    const left = Math.max(0, card?.balance ?? 0);
    await tx.update(schema.giftCards).set({ balance: 0 }).where(eq(schema.giftCards.id, giftCardId));
    await tx.insert(schema.giftCardLedger).values({
      giftCardId,
      orderId,
      amount: -left,
      note: `Short by ${amount - left} — balance was used on another order`,
    });
    console.error(`[giftcard] ${giftCardId} short by ${amount - left} cents on order ${orderId}`);
    return false;
  }
  await tx.insert(schema.giftCardLedger).values({ giftCardId, orderId, amount: -amount, note: "Order" });
  return true;
}

/** Admin: issue a card directly (store credit, compensation, giveaways). */
export async function issueGiftCard(amount: number, currency: string, recipientEmail: string | null, note: string) {
  const db = await getDb();
  const card = await createPendingGiftCard({ amount, currency, recipientEmail, recipientName: null, senderName: null, message: null });
  const [active] = await db
    .update(schema.giftCards)
    .set({ status: "active", balance: amount })
    .where(eq(schema.giftCards.id, card.id))
    .returning();
  await db.insert(schema.giftCardLedger).values({ giftCardId: card.id, amount, note: note || "Issued by admin" });
  if (recipientEmail) await sendGiftCardEmail(active);
  return active;
}

/* ── Admin management ─────────────────────────────────────── */

export async function getGiftCard(id: string) {
  const db = await getDb();
  const [card] = await db.select().from(schema.giftCards).where(eq(schema.giftCards.id, id)).limit(1);
  if (!card) return null;
  const ledger = await db
    .select()
    .from(schema.giftCardLedger)
    .where(eq(schema.giftCardLedger.giftCardId, id))
    .orderBy(sql`${schema.giftCardLedger.createdAt} desc`);
  return { card, ledger };
}

export async function updateGiftCardDetails(
  id: string,
  d: { recipientEmail: string | null; recipientName: string | null; senderName: string | null; message: string | null },
) {
  const db = await getDb();
  await db.update(schema.giftCards).set(d).where(eq(schema.giftCards.id, id));
}

/** Add (positive) or remove (negative) balance, with a note in the history. */
export async function adjustGiftCardBalance(id: string, delta: number, note: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [card] = await tx.select().from(schema.giftCards).where(eq(schema.giftCards.id, id)).limit(1);
    if (!card) throw new Error("Gift card not found");
    const next = card.balance + delta;
    if (next < 0) throw new Error(`The balance is only ${(card.balance / 100).toFixed(2)}.`);
    await tx.update(schema.giftCards).set({ balance: next }).where(eq(schema.giftCards.id, id));
    await tx.insert(schema.giftCardLedger).values({ giftCardId: id, amount: delta, note: note || (delta > 0 ? "Added by staff" : "Removed by staff") });
    return next;
  });
}

/** Delete a card that was never spent on an order; anything else can only be disabled. */
export async function deleteGiftCard(id: string): Promise<boolean> {
  const db = await getDb();
  const [used] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.giftCardLedger)
    .where(and(eq(schema.giftCardLedger.giftCardId, id), isNotNull(schema.giftCardLedger.orderId)));
  if (used.n > 0) return false;
  await db.delete(schema.giftCards).where(eq(schema.giftCards.id, id));
  return true;
}

export async function resendGiftCard(id: string) {
  const data = await getGiftCard(id);
  if (!data?.card.recipientEmail && !data?.card.purchaserEmail) throw new Error("This card has no email address.");
  const card = data.card.recipientEmail ? data.card : { ...data.card, recipientEmail: data.card.purchaserEmail };
  await sendGiftCardEmail(card);
}

/** Stripe payment for a purchased card (for "View in Stripe"). */
export async function giftCardPaymentIntent(sessionId: string | null) {
  if (!sessionId) return null;
  try {
    const s = await getStripe().checkout.sessions.retrieve(sessionId);
    return typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null);
  } catch {
    return null;
  }
}

const REFUND_NOTE = "Refunded in Stripe";

/**
 * A gift card purchase refunded in Stripe takes the same amount off the card
 * (a full refund disables it). Safe to run more than once for the same charge.
 */
export async function syncGiftCardRefund(charge: Stripe.Charge) {
  let id = charge.metadata?.giftCardId;
  if (!id && typeof charge.payment_intent === "string") {
    const pi = await getStripe().paymentIntents.retrieve(charge.payment_intent);
    if (pi.metadata?.kind === "giftcard") id = pi.metadata.giftCardId;
  }
  if (!id) return false;
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [card] = await tx.select().from(schema.giftCards).where(eq(schema.giftCards.id, id)).limit(1);
    if (!card) return;
    const [done] = await tx
      .select({ total: sql<number>`coalesce(-sum(${schema.giftCardLedger.amount}),0)::int` })
      .from(schema.giftCardLedger)
      .where(and(eq(schema.giftCardLedger.giftCardId, id), like(schema.giftCardLedger.note, `${REFUND_NOTE}%`)));
    const todo = charge.amount_refunded - done.total;
    if (todo <= 0) return;
    const take = Math.min(todo, card.balance);
    const full = charge.refunded || charge.amount_refunded >= charge.amount;
    await tx
      .update(schema.giftCards)
      .set({ balance: card.balance - take, ...(full ? { status: "disabled" as const } : {}) })
      .where(eq(schema.giftCards.id, id));
    await tx.insert(schema.giftCardLedger).values({ giftCardId: id, amount: -todo, note: full ? `${REFUND_NOTE} · card disabled` : REFUND_NOTE });
  });
  return true;
}
