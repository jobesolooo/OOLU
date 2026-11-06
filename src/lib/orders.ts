import "server-only";
import type Stripe from "stripe";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { Order, OrderItem, OrderStatus } from "./db/schema";
import { decrementStock } from "./inventory";
import { sendAdminNewOrder, sendOrderConfirmation, sendRefundNotice } from "./email";

export type NewOrderItem = {
  productId: string;
  priceId: string;
  name: string;
  size: string | null;
  quantity: number;
  unitAmount: number;
  image: string | null;
};

export async function createPendingOrder(input: {
  userId: string | null;
  email: string | null;
  currency: string;
  items: NewOrderItem[];
}) {
  const db = await getDb();
  const subtotal = input.items.reduce((s, i) => s + i.unitAmount * i.quantity, 0);
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(schema.orders)
      .values({
        userId: input.userId,
        email: input.email,
        currency: input.currency,
        subtotal,
        total: subtotal,
        status: "pending",
      })
      .returning();
    await tx.insert(schema.orderItems).values(input.items.map((i) => ({ ...i, orderId: order.id })));
    return order;
  });
}

export async function attachCheckoutSession(orderId: string, sessionId: string) {
  const db = await getDb();
  await db
    .update(schema.orders)
    .set({ stripeSessionId: sessionId, updatedAt: new Date() })
    .where(eq(schema.orders.id, orderId));
}

export async function getOrder(id: string) {
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return { order, items };
}

export async function getOrderBySession(sessionId: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripeSessionId, sessionId))
    .limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}

export async function listOrdersForUser(userId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.userId, userId)))
    .orderBy(desc(schema.orders.createdAt));
}

/** Webhook: idempotency guard. Returns false if the event was already handled. */
export async function claimEvent(event: Stripe.Event) {
  const db = await getDb();
  const inserted = await db
    .insert(schema.processedEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning();
  return inserted.length > 0;
}

export async function releaseEvent(eventId: string) {
  const db = await getDb();
  await db.delete(schema.processedEvents).where(eq(schema.processedEvents.id, eventId));
}

/** checkout.session.completed / async_payment_succeeded → mark the order paid. */
export async function markOrderPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return null;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return null;

  const db = await getDb();
  const shipping = session.collected_information?.shipping_details ?? null;
  const details = session.customer_details;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
    if (!existing) return null;
    if (existing.status !== "pending" && existing.status !== "cancelled") return null; // already processed

    const [order] = await tx
      .update(schema.orders)
      .set({
        status: "paid",
        email: details?.email ?? existing.email,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
        subtotal: session.amount_subtotal ?? existing.subtotal,
        shipping: session.total_details?.amount_shipping ?? 0,
        tax: session.total_details?.amount_tax ?? 0,
        total: session.amount_total ?? existing.total,
        currency: session.currency ?? existing.currency,
        shippingAddress: shipping
          ? { name: shipping.name, ...shipping.address, phone: details?.phone ?? null }
          : details?.address
            ? { name: details.name, ...details.address, phone: details.phone ?? null }
            : null,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      // Conditional update makes this safe if the webhook and the success page race.
      .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, ["pending", "cancelled"])))
      .returning();
    if (!order) return null;

    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    await decrementStock(tx, items);
    return { order, items };
  });

  if (result) {
    await Promise.all([sendOrderConfirmation(result.order, result.items), sendAdminNewOrder(result.order, result.items)]);
  }
  return result;
}

export async function markOrderCancelled(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  const db = await getDb();
  await db
    .update(schema.orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")));
}

/** charge.refunded → sync refunded amount + status. */
export async function syncRefund(charge: Stripe.Charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return;
  const db = await getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripePaymentIntentId, pi))
    .limit(1);
  if (!order) return;
  const newlyRefunded = charge.amount_refunded - order.refundedAmount;
  const status: OrderStatus = charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded";
  const [updated] = await db
    .update(schema.orders)
    .set({ refundedAmount: charge.amount_refunded, status, updatedAt: new Date() })
    .where(eq(schema.orders.id, order.id))
    .returning();
  if (newlyRefunded > 0) await sendRefundNotice(updated, newlyRefunded);
}

export function orderStatusLabel(status: OrderStatus) {
  return (
    {
      pending: "Awaiting payment",
      paid: "Paid",
      fulfilled: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
      partially_refunded: "Partially refunded",
    } as const
  )[status];
}

export type OrderWithItems = { order: Order; items: OrderItem[] };
