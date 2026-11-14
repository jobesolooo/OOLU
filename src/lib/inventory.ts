import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb, schema, type DB } from "./db";

export const stockKey = (productId: string, size: string | null | undefined) => `${productId}|${size ?? ""}`;

/** Stored quantity meaning "unlimited (∞)". Sizes with no stored row have 0 in stock. */
export const UNLIMITED = -1;

/**
 * "productId|size" → quantity in stock. A size that was never set counts as 0 (sold out);
 * a size set to ∞ returns undefined, which every caller treats as "no limit".
 */
export class StockMap extends Map<string, number> {
  override get(key: string): number | undefined {
    if (!super.has(key)) return 0;
    const v = super.get(key)!;
    return v < 0 ? undefined : v;
  }
  override has(): boolean {
    return true; // every size has a stock level now (0 by default)
  }
}

export async function getStockMap(productIds?: string[]) {
  const db = await getDb();
  const rows = productIds?.length
    ? await db.select().from(schema.inventory).where(inArray(schema.inventory.productId, productIds))
    : await db.select().from(schema.inventory);
  return new StockMap(rows.map((r) => [stockKey(r.productId, r.size), r.quantity]));
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

/** ∞: this size never runs out. */
export async function setUnlimited(productId: string, size: string) {
  const db = await getDb();
  await db
    .insert(schema.inventory)
    .values({ productId, size, quantity: UNLIMITED })
    .onConflictDoUpdate({
      target: [schema.inventory.productId, schema.inventory.size],
      set: { quantity: UNLIMITED, updatedAt: new Date() },
    });
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
      // ∞ sizes (stored as -1) are left alone.
      .where(and(eq(schema.inventory.productId, item.productId), eq(schema.inventory.size, item.size ?? ""), gte(schema.inventory.quantity, 0)));
  }
}
