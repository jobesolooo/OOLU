"use server";

/**
 * Signed-in customers managing their own data: profile details, email change,
 * address book and reviews. Every action checks the session and only touches
 * rows that belong to that user.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { consumeAuthToken, createAuthToken, getCurrentUser, markEmailVerified, rotateSessions, signIn, verifyPassword } from "@/lib/auth";
import { AddressInput, deleteAddress, saveAddress, setDefaultAddress } from "@/lib/account";
import { sendEmailChange, sendSecurityNotice } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { invalidateCatalog } from "@/lib/catalog";
import type { FormState } from "./actions";

async function me(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

/* ── Profile ─────────────────────────────────────────────── */
const Profile = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  phone: optional(30).refine((v) => !v || /^[+\d][\d\s()-]{5,}$/.test(v), "Enter a valid phone number"),
  birthday: optional(10).refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v) < new Date()), "Enter a valid date"),
  sizeTop: z.enum(SIZES).optional().or(z.literal("")).transform((v) => v || null),
  sizeBottom: z.enum(SIZES).optional().or(z.literal("")).transform((v) => v || null),
});

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await me("/account/profile");
  const parsed = Profile.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const db = await getDb();
  const [row] = await db.update(schema.users).set(parsed.data).where(eq(schema.users.id, user.id)).returning();
  // Keep the Stripe customer's name and phone in step.
  if (row.stripeCustomerId && isStripeConfigured()) {
    await getStripe()
      .customers.update(row.stripeCustomerId, { name: parsed.data.name, phone: parsed.data.phone ?? "" })
      .catch((e) => console.error("[account] Stripe customer update failed", e));
  }
  revalidatePath("/account", "layout");
  return { ok: "Saved" };
}

/* ── Email change (confirmed from the new inbox) ─────────── */
export async function requestEmailChange(_: FormState, form: FormData): Promise<FormState> {
  const user = await me("/account/profile");
  const email = z.string().trim().toLowerCase().email("Enter a valid email").safeParse(form.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message };
  if (email.data === user.email) return { error: "That's already your email." };
  if (!rateLimit(`email-change:${user.id}`, 5, 60 * 60_000).ok) return { error: "Too many requests. Try again later." };
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (row.passwordHash) {
    const pw = String(form.get("password") ?? "");
    if (!pw || !(await verifyPassword(pw, row.passwordHash))) return { error: "Your password is incorrect." };
  }
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email.data)).limit(1);
  if (taken) return { error: "Another account already uses that email." };
  await db.update(schema.users).set({ pendingEmail: email.data }).where(eq(schema.users.id, user.id));
  await sendEmailChange(email.data, await createAuthToken(user.id, "change_email", 24 * 60));
  await sendSecurityNotice(user.email, `Someone asked to change your account email to ${email.data}. It only changes once that inbox confirms.`);
  revalidatePath("/account/profile");
  return { ok: `Check ${email.data} for a confirmation link.` };
}

export async function cancelEmailChange() {
  const user = await me("/account/profile");
  const db = await getDb();
  await db.update(schema.users).set({ pendingEmail: null }).where(eq(schema.users.id, user.id));
  await db
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.userId, user.id), eq(schema.authTokens.type, "change_email")));
  revalidatePath("/account/profile");
}

/** Used by /account/confirm-email. Returns the new email, or an error code. */
export async function confirmEmailChange(token: string): Promise<{ ok: true; email: string } | { ok: false; reason: "invalid" | "taken" }> {
  const ip = await clientIp();
  if (!rateLimit(`email-confirm:${ip}`, 20, 60 * 60_000).ok) return { ok: false, reason: "invalid" };
  const userId = await consumeAuthToken(token, "change_email");
  if (!userId) return { ok: false, reason: "invalid" };
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!row?.pendingEmail) return { ok: false, reason: "invalid" };
  const next = row.pendingEmail;
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, next)).limit(1);
  if (taken) {
    await db.update(schema.users).set({ pendingEmail: null }).where(eq(schema.users.id, userId));
    return { ok: false, reason: "taken" };
  }
  const old = row.email;
  await db.update(schema.users).set({ email: next, pendingEmail: null }).where(eq(schema.users.id, userId));
  await markEmailVerified(userId); // the link proves the new inbox (and links guest orders placed with it)
  // Newsletter follows the account's email.
  await db.update(schema.subscribers).set({ email: next }).where(eq(schema.subscribers.email, old)).catch(() => {});
  if (row.stripeCustomerId && isStripeConfigured()) {
    await getStripe().customers.update(row.stripeCustomerId, { email: next }).catch((e) => console.error("[account] Stripe email update failed", e));
  }
  await rotateSessions(userId, false);
  const [fresh] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  await signIn(fresh);
  await sendSecurityNotice(old, `The email on your account was changed to ${next}. If this wasn't you, reply to this email straight away.`);
  return { ok: true, email: next };
}

/* ── Addresses ───────────────────────────────────────────── */
export async function saveAddressAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await me("/account/addresses");
  const parsed = AddressInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the address" };
  const id = z.string().uuid().safeParse(form.get("id"));
  try {
    await saveAddress(user.id, parsed.data, id.success ? id.data : undefined);
  } catch {
    return { error: "That address no longer exists." };
  }
  revalidatePath("/account", "layout");
  redirect(`/account/addresses?saved=${id.success ? "updated" : "added"}`);
}

export async function deleteAddressAction(form: FormData) {
  const user = await me("/account/addresses");
  const id = z.string().uuid().parse(form.get("id"));
  await deleteAddress(user.id, id);
  revalidatePath("/account", "layout");
  redirect("/account/addresses?saved=deleted");
}

export async function defaultAddressAction(form: FormData) {
  const user = await me("/account/addresses");
  const id = z.string().uuid().parse(form.get("id"));
  await setDefaultAddress(user.id, id);
  revalidatePath("/account", "layout");
}

/* ── Reviews ─────────────────────────────────────────────── */
const ReviewEdit = z.object({
  id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: optional(120),
  body: z.string().trim().min(10, "Write at least a sentence").max(3000),
  fit: z.enum(["small", "true", "large"]).optional().or(z.literal("")).transform((v) => v || null),
});

export async function updateMyReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await me("/account/reviews");
  const parsed = ReviewEdit.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the review" };
  const { id, ...fields } = parsed.data;
  const db = await getDb();
  // Status is kept: a review staff hid stays hidden after an edit.
  const [row] = await db
    .update(schema.reviews)
    .set(fields)
    .where(and(eq(schema.reviews.id, id), eq(schema.reviews.userId, user.id)))
    .returning();
  if (!row) return { error: "That review no longer exists." };
  invalidateCatalog();
  revalidatePath("/account/reviews");
  redirect("/account/reviews?saved=updated");
}

export async function deleteMyReview(form: FormData) {
  const user = await me("/account/reviews");
  const id = z.string().uuid().parse(form.get("id"));
  const db = await getDb();
  await db.delete(schema.reviews).where(and(eq(schema.reviews.id, id), eq(schema.reviews.userId, user.id)));
  invalidateCatalog();
  revalidatePath("/account/reviews");
  redirect("/account/reviews?saved=deleted");
}
