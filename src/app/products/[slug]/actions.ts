"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getProductById } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { getUserReview, hasPurchased } from "@/lib/reviews";

export type ReviewState = { ok?: string; error?: string } | undefined;

const Review = z.object({
  productId: z.string().min(1).max(100),
  rating: z.coerce.number().int().min(1, "Pick a star rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(3000),
  size: z.string().trim().max(20).optional(),
  fit: z.enum(["small", "true", "large"]).optional().or(z.literal("")),
});

export async function submitReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to write a review." };
  const parsed = Review.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;

  const product = await getProductById(d.productId);
  if (!product) return { error: "Product not found." };
  if (await getUserReview(user.id, product.id)) return { error: "You've already reviewed this product." };

  const verified = await hasPurchased(user.id, product.id);
  const db = await getDb();
  await db.insert(schema.reviews).values({
    productId: product.id,
    userId: user.id,
    name: user.name?.split(" ")[0] ?? "Customer",
    rating: d.rating,
    title: d.title || null,
    body: d.body,
    size: d.size || null,
    fit: d.fit || null,
    verified,
    // Verified buyers go live straight away; other reviews wait for approval in /admin/reviews.
    status: verified ? "approved" : "pending",
  });
  revalidatePath(`/products/${product.slug}`);
  return { ok: verified ? "Thanks! Your review is live." : "Thanks! Your review will appear once it's been checked." };
}
