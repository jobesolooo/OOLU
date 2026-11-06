import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getProducts, isUpcoming } from "./catalog";
import { sendStockAlert } from "./email";

export async function createStockAlert(email: string, productId: string, size: string) {
  const db = await getDb();
  await db
    .insert(schema.stockAlerts)
    .values({ email: email.toLowerCase(), productId, size })
    .onConflictDoUpdate({
      target: [schema.stockAlerts.email, schema.stockAlerts.productId, schema.stockAlerts.size],
      set: { notifiedAt: null, createdAt: new Date() },
    });
}

/** Email everyone waiting on this product/size, then mark them notified. */
export async function notifyRestock(productId: string, size: string) {
  const product = (await getProducts()).find((p) => p.id === productId);
  if (!product || isUpcoming(product)) return 0;
  const db = await getDb();
  const waiting = await db
    .select()
    .from(schema.stockAlerts)
    .where(
      and(
        eq(schema.stockAlerts.productId, productId),
        inArray(schema.stockAlerts.size, [size, ""]),
        isNull(schema.stockAlerts.notifiedAt),
      ),
    );
  for (const a of waiting) {
    await sendStockAlert(a.email, product.name, a.size, product.slug);
    await db.update(schema.stockAlerts).set({ notifiedAt: new Date() }).where(eq(schema.stockAlerts.id, a.id));
  }
  return waiting.length;
}

/** Email "it's live" to everyone waiting on drops that have now released. Called by the cron route. */
export async function notifyReleasedDrops() {
  const db = await getDb();
  const waiting = await db.select().from(schema.stockAlerts).where(isNull(schema.stockAlerts.notifiedAt));
  if (!waiting.length) return 0;
  const products = new Map((await getProducts()).map((p) => [p.id, p]));
  let sent = 0;
  for (const a of waiting) {
    const p = products.get(a.productId);
    if (!p || p.releaseAt == null || isUpcoming(p)) continue; // only launch alerts here
    await sendStockAlert(a.email, p.name, a.size, p.slug, true);
    await db.update(schema.stockAlerts).set({ notifiedAt: new Date() }).where(eq(schema.stockAlerts.id, a.id));
    sent++;
  }
  return sent;
}
