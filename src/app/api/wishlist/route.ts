import { NextResponse } from "next/server";
import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getProductsByIds } from "@/lib/catalog";

async function snapshot(userId: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, userId)).orderBy(schema.wishlistItems.createdAt);
  const products = await getProductsByIds(rows.map((r) => r.productId).reverse());
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0] ?? null,
    unitAmount: p.unitAmount,
    compareAtAmount: p.compareAtAmount,
    currency: p.currency,
  }));
}

/** The signed-in user's wishlist (401 when signed out — the browser copy is used instead). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: null }, { status: 401 });
  return NextResponse.json({ items: await snapshot(user.id) });
}

const Body = z.object({ ids: z.array(z.string().min(1).max(100)).max(200) });

/** Replace the account wishlist with this list of product ids. */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const valid = (await getProductsByIds(parsed.data.ids)).map((p) => p.id);
  const db = await getDb();
  if (valid.length) {
    await db
      .insert(schema.wishlistItems)
      .values(valid.map((productId) => ({ userId: user.id, productId })))
      .onConflictDoNothing();
    await db.delete(schema.wishlistItems).where(and(eq(schema.wishlistItems.userId, user.id), notInArray(schema.wishlistItems.productId, valid)));
  } else {
    await db.delete(schema.wishlistItems).where(eq(schema.wishlistItems.userId, user.id));
  }
  return NextResponse.json({ ok: true, count: valid.length });
}
