"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ORDER_STATUSES, RETURN_STATUSES } from "@/lib/db/schema";
import { createPromotion, setPromotionActive } from "@/lib/promotions";
import { issueGiftCard } from "@/lib/giftcards";
import { getSettings, saveSettings, type StoreSettings } from "@/lib/settings";
import { getStripe } from "@/lib/stripe";
import { getOrder, syncRefund } from "@/lib/orders";
import { clearStockTracking, getStockMap, setStock, stockKey } from "@/lib/inventory";
import { notifyRestock } from "@/lib/alerts";
import { sendReturnUpdate, sendShippingUpdate } from "@/lib/email";
import { invalidateCatalog } from "@/lib/catalog";

export type ActionResult = { ok?: string; error?: string } | undefined;

const StatusForm = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  trackingCarrier: z.string().trim().max(60).optional().default(""),
  trackingNumber: z.string().trim().max(120).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
  notify: z.string().optional(),
});

export async function updateOrder(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = StatusForm.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid form" };
  const { orderId, status, trackingCarrier, trackingNumber, notes, notify } = parsed.data;

  const db = await getDb();
  const [before] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!before) return { error: "Order not found" };
  if (before.status === "pending" && status !== "pending" && status !== "cancelled") {
    return { error: "This order hasn't been paid. Only cancel it." };
  }

  const [order] = await db
    .update(schema.orders)
    .set({
      status,
      trackingCarrier: trackingCarrier || null,
      trackingNumber: trackingNumber || null,
      notes: notes || null,
      updatedAt: new Date(),
      ...(status === "shipped" && !before.shippedAt ? { shippedAt: new Date() } : {}),
      ...(status === "delivered" && !before.deliveredAt
        ? { deliveredAt: new Date(), shippedAt: before.shippedAt ?? new Date() }
        : {}),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  if (notify === "on" && status === "shipped" && before.status !== "shipped") await sendShippingUpdate(order);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: "Order updated" };
}

export async function refundOrder(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderId = String(form.get("orderId") ?? "");
  const amountRaw = String(form.get("amount") ?? "").trim();
  const data = await getOrder(orderId);
  if (!data) return { error: "Order not found" };
  const { order } = data;
  if (!order.stripePaymentIntentId) return { error: "No payment on this order to refund." };

  const remaining = order.total - order.refundedAmount;
  const amount = amountRaw ? Math.round(Number(amountRaw) * 100) : remaining;
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (amount > remaining) return { error: `You can refund at most ${(remaining / 100).toFixed(2)}.` };

  try {
    const stripe = getStripe();
    await stripe.refunds.create(
      { payment_intent: order.stripePaymentIntentId, amount, metadata: { orderId } },
      { idempotencyKey: `refund_${orderId}_${order.refundedAmount}_${amount}` },
    );
    // Sync right away; the charge.refunded webhook will confirm (idempotently).
    const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ["latest_charge"] });
    if (pi.latest_charge && typeof pi.latest_charge !== "string") await syncRefund(pi.latest_charge);
  } catch (err) {
    console.error("[admin] refund failed", err);
    return { error: err instanceof Error ? err.message : "Refund failed" };
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: "Refund issued" };
}

export async function saveInventory(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const productId = String(form.get("productId") ?? "");
  if (!productId) return { error: "Missing product" };
  const before = await getStockMap([productId]);
  let notified = 0;
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("size:")) continue;
    const size = key.slice(5);
    const v = String(value).trim();
    const was = before.get(stockKey(productId, size));
    if (v === "") {
      await clearStockTracking(productId, size);
      if (was === 0) notified += await notifyRestock(productId, size);
    } else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) return { error: `Stock for ${size} must be a whole number.` };
      await setStock(productId, size, n);
      // Back in stock → email everyone waiting for this size.
      if (was === 0 && n > 0) notified += await notifyRestock(productId, size);
    }
  }
  revalidatePath("/admin/inventory");
  return { ok: notified ? `Saved · emailed ${notified} waiting customer${notified === 1 ? "" : "s"}` : "Saved" };
}

export async function refreshCatalog() {
  await requireAdmin();
  invalidateCatalog();
  revalidatePath("/admin/inventory");
}

/* ── Reviews ─────────────────────────────────────────────── */
export async function moderateReview(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const action = z.enum(["approve", "reject", "delete"]).parse(form.get("action"));
  const db = await getDb();
  if (action === "delete") await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
  else await db.update(schema.reviews).set({ status: action === "approve" ? "approved" : "rejected" }).where(eq(schema.reviews.id, id));
  revalidatePath("/admin/reviews");
}

/* ── Messages ────────────────────────────────────────────── */
export async function setMessageStatus(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const status = z.enum(["new", "done"]).parse(form.get("status"));
  const db = await getDb();
  await db.update(schema.contactMessages).set({ status }).where(eq(schema.contactMessages.id, id));
  revalidatePath("/admin/messages");
}

/* ── Returns ─────────────────────────────────────────────── */
export async function updateReturn(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  const next = z.enum(RETURN_STATUSES).safeParse(form.get("status"));
  if (!id.success || !next.success) return { error: "Invalid request" };
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const issueRefund = form.get("refund") === "on";

  const db = await getDb();
  const [ret] = await db.select().from(schema.returnRequests).where(eq(schema.returnRequests.id, id.data)).limit(1);
  if (!ret) return { error: "Return not found" };
  const data = await getOrder(ret.orderId);
  if (!data) return { error: "Order not found" };
  const { order } = data;

  if (next.data === "refunded" && issueRefund) {
    if (!order.stripePaymentIntentId) return { error: "This order has no card payment to refund. Issue a gift card instead." };
    const remaining = order.total - order.refundedAmount;
    const amount = Math.min(ret.refundAmount, remaining);
    if (amount <= 0) return { error: "Nothing left to refund on this order." };
    try {
      const stripe = getStripe();
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId, amount, metadata: { orderId: order.id, returnId: ret.id } },
        { idempotencyKey: `return_${ret.id}` },
      );
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ["latest_charge"] });
      if (pi.latest_charge && typeof pi.latest_charge !== "string") await syncRefund(pi.latest_charge);
    } catch (err) {
      console.error("[admin] return refund failed", err);
      return { error: err instanceof Error ? err.message : "Refund failed" };
    }
  }

  await db
    .update(schema.returnRequests)
    .set({ status: next.data, adminNote: note, updatedAt: new Date() })
    .where(eq(schema.returnRequests.id, ret.id));
  if (next.data !== ret.status) await sendReturnUpdate(order.email, order.number, next.data, note);
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: "Return updated" };
}

/* ── Discounts ───────────────────────────────────────────── */
const PromoForm = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Codes use 3–30 letters, numbers, - or _"),
  kind: z.enum(["percent", "amount"]),
  value: z.coerce.number().positive("Enter a value"),
  maxRedemptions: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  expiresAt: z.string().optional(),
  minimumAmount: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  firstOrderOnly: z.string().optional(),
});

export async function createDiscount(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PromoForm.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const d = parsed.data;
  if (d.kind === "percent" && d.value > 100) return { error: "Percent can't be more than 100." };
  try {
    await createPromotion({
      code: d.code,
      kind: d.kind,
      value: d.value,
      maxRedemptions: d.maxRedemptions,
      expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59`) : undefined,
      minimumAmount: d.minimumAmount,
      firstOrderOnly: d.firstOrderOnly === "on",
      currency: "usd",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create code" };
  }
  revalidatePath("/admin/discounts");
  return { ok: `Code ${d.code} created` };
}

export async function toggleDiscount(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(form.get("id"));
  await setPromotionActive(id, form.get("active") === "true");
  revalidatePath("/admin/discounts");
}

/* ── Gift cards ──────────────────────────────────────────── */
export async function adminIssueGiftCard(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const amount = Math.round(Number(form.get("amount")) * 100);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return { error: "Enter an amount between 0.01 and 1000." };
  const email = String(form.get("email") ?? "").trim();
  if (email && !z.string().email().safeParse(email).success) return { error: "Enter a valid email or leave it blank." };
  const card = await issueGiftCard(amount, "usd", email || null, String(form.get("note") ?? ""));
  revalidatePath("/admin/gift-cards");
  return { ok: `Issued ${card.code}${email ? ` and emailed ${email}` : ""}` };
}

export async function setGiftCardDisabled(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const disabled = form.get("disabled") === "true";
  const db = await getDb();
  await db.update(schema.giftCards).set({ status: disabled ? "disabled" : "active" }).where(eq(schema.giftCards.id, id));
  revalidatePath("/admin/gift-cards");
}

/* ── Settings ────────────────────────────────────────────── */
export async function saveStoreSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const current = await getSettings();
  const launch = String(form.get("launchAt") ?? "").trim();
  const next: StoreSettings = {
    announcement: String(form.get("announcement") ?? "").trim().slice(0, 140) || current.announcement,
    dropBanner: {
      enabled: form.get("bannerEnabled") === "on",
      eyebrow: String(form.get("eyebrow") ?? "").slice(0, 60),
      title: String(form.get("title") ?? "").slice(0, 80),
      body: String(form.get("body") ?? "").slice(0, 240),
      launchAt: launch ? new Date(`${launch}Z`).toISOString() : null,
      href: String(form.get("href") ?? "/drops").slice(0, 200) || "/drops",
    },
    popup: {
      enabled: form.get("popupEnabled") === "on",
      percentOff: Math.min(90, Math.max(1, Math.round(Number(form.get("percentOff")) || current.popup.percentOff))),
      delaySeconds: Math.min(120, Math.max(0, Math.round(Number(form.get("delaySeconds")) || 0))),
    },
  };
  if (launch && Number.isNaN(Date.parse(`${launch}Z`))) return { error: "Invalid launch date." };
  await saveSettings(next);
  revalidatePath("/", "layout");
  return { ok: "Settings saved" };
}
