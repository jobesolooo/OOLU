import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { Order, OrderItem, ReturnLine } from "./db/schema";

export const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS ?? 30);
export const RETURN_REASONS = [
  "Too small",
  "Too big",
  "Not as described",
  "Arrived damaged",
  "Wrong item sent",
  "Changed my mind",
  "Other",
] as const;

const RETURNABLE: Order["status"][] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded"];

export async function getReturnsForOrder(orderId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.returnRequests)
    .where(eq(schema.returnRequests.orderId, orderId))
    .orderBy(desc(schema.returnRequests.createdAt));
}

/** How many of each order item can still be returned (not already in an open/approved return). */
export async function returnableQuantities(order: Order, items: OrderItem[]) {
  const existing = await getReturnsForOrder(order.id);
  const used = new Map<string, number>();
  for (const r of existing) {
    if (r.status === "rejected") continue;
    for (const line of r.items) used.set(line.orderItemId, (used.get(line.orderItemId) ?? 0) + line.quantity);
  }
  return new Map(items.map((i) => [i.id, Math.max(0, i.quantity - (used.get(i.id) ?? 0))]));
}

export function returnEligibility(order: Order) {
  if (!RETURNABLE.includes(order.status)) return { ok: false as const, reason: "This order can't be returned." };
  const from = order.deliveredAt ?? order.shippedAt ?? order.paidAt ?? order.createdAt;
  const deadline = new Date(from).getTime() + RETURN_WINDOW_DAYS * 86_400_000;
  if (Date.now() > deadline) return { ok: false as const, reason: `The ${RETURN_WINDOW_DAYS}-day return window has closed.` };
  return { ok: true as const, deadline };
}

export function refundForLines(items: OrderItem[], lines: ReturnLine[]) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return lines.reduce((sum, l) => sum + (byId.get(l.orderItemId)?.unitAmount ?? 0) * l.quantity, 0);
}

export async function listReturns(statuses?: (typeof schema.returnRequests.$inferSelect)["status"][]) {
  const db = await getDb();
  return db
    .select({ r: schema.returnRequests, order: schema.orders })
    .from(schema.returnRequests)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.returnRequests.orderId))
    .where(statuses?.length ? inArray(schema.returnRequests.status, statuses) : undefined)
    .orderBy(desc(schema.returnRequests.createdAt))
    .limit(200);
}
