import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema, type DB } from "./db";

export const stockKey = (productId: string, size: string | null | undefined) => `${productId}|${size ?? ""}`;

/** Map of "productId|size" → quantity. Missing key = stock not tracked (unlimited). */
export async function getStockMap(productIds?: string[]) {
  const db = await getDb();
  const rows = productIds?.length
    ? await db.select().from(schema.inventory).where(inArray(schema.inventory.productId, productIds))
    : await db.select().from(schema.inventory);
  return new Map(rows.map((r) => [stockKey(r.productId, r.size), r.quantity]));
}

export async function setStock(productId: string, size: string, quantity: number) {
  const db = await getDb();
  const qty = Math.max(0, Math.floor(quantity));
  await db
    .insert(schema.inventory)
    .values({ productId, size, quantity: qty })
    .onConflictDoUpdate({
      target: [schema.inventory.productId, schema.inventory.size],
      set: { quantity: qty, updatedAt: new Date() },
    });
}

export async function clearStockTracking(productId: string, size: string) {
  const db = await getDb();
  await db
    .delete(schema.inventory)
    .where(and(eq(schema.inventory.productId, productId), eq(schema.inventory.size, size)));
}

export async function decrementStock(
  tx: DB | Parameters<Parameters<DB["transaction"]>[0]>[0],
  items: { productId: string; size: string | null; quantity: number }[],
) {
  for (const item of items) {
    await tx
      .update(schema.inventory)
      .set({
        quantity: sql`GREATEST(${schema.inventory.quantity} - ${item.quantity}, 0)`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.inventory.productId, item.productId), eq(schema.inventory.size, item.size ?? "")));
  }
}
