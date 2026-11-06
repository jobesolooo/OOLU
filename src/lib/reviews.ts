import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getProducts } from "./catalog";

export type ReviewSummary = { count: number; average: number; distribution: number[] /* index 0 = 1 star */ };

export async function getApprovedReviews(productIds: string[]) {
  if (!productIds.length) return [];
  const db = await getDb();
  return db
    .select()
    .from(schema.reviews)
    // Everything except reviews staff have rejected (older "pending" ones included).
    .where(and(inArray(schema.reviews.productId, productIds), ne(schema.reviews.status, "rejected")))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(100);
}

export function summarize(list: { rating: number }[]): ReviewSummary {
  const distribution = [0, 0, 0, 0, 0];
  for (const r of list) distribution[Math.min(5, Math.max(1, r.rating)) - 1]++;
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, average, distribution };
}

/** Average rating + count per product, for product cards. */
export async function getRatingsMap() {
  const db = await getDb();
  const rows = await db
    .select({
      productId: schema.reviews.productId,
      count: sql<number>`count(*)::int`,
      average: sql<number>`avg(${schema.reviews.rating})::float`,
    })
    .from(schema.reviews)
    .where(ne(schema.reviews.status, "rejected"))
    .groupBy(schema.reviews.productId);
  // Colourways of the same item share their reviews, so they share the rating too.
  const products = await getProducts();
  const groupOf = new Map(products.map((p) => [p.id, p.group ?? p.id]));
  const byGroup = new Map<string, { count: number; sum: number }>();
  for (const r of rows) {
    const g = groupOf.get(r.productId) ?? r.productId;
    const cur = byGroup.get(g) ?? { count: 0, sum: 0 };
    byGroup.set(g, { count: cur.count + r.count, sum: cur.sum + r.average * r.count });
  }
  const map = new Map<string, { count: number; average: number }>();
  for (const p of products) {
    const g = byGroup.get(p.group ?? p.id);
    if (g) map.set(p.id, { count: g.count, average: g.sum / g.count });
  }
  return map;
}

/** True when this user has a paid order containing the product. */
export async function hasPurchased(userId: string, productId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.orderItems.id })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orderItems.productId, productId),
        inArray(schema.orders.status, ["paid", "fulfilled", "shipped", "delivered", "partially_refunded"]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getUserReview(userId: string, productId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.reviews)
    .where(and(eq(schema.reviews.userId, userId), eq(schema.reviews.productId, productId)))
    .limit(1);
  return row ?? null;
}
