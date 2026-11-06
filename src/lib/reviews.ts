import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "./db";

export type ReviewSummary = { count: number; average: number; distribution: number[] /* index 0 = 1 star */ };

export async function getApprovedReviews(productIds: string[]) {
  if (!productIds.length) return [];
  const db = await getDb();
  return db
    .select()
    .from(schema.reviews)
    .where(and(inArray(schema.reviews.productId, productIds), eq(schema.reviews.status, "approved")))
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
    .where(eq(schema.reviews.status, "approved"))
    .groupBy(schema.reviews.productId);
  return new Map(rows.map((r) => [r.productId, { count: r.count, average: r.average }]));
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
