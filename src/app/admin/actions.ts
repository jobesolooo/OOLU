"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { getOrder, syncRefund } from "@/lib/orders";
import { clearStockTracking, setStock } from "@/lib/inventory";
import { sendShippingUpdate } from "@/lib/email";
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
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("size:")) continue;
    const size = key.slice(5);
    const v = String(value).trim();
    if (v === "") await clearStockTracking(productId, size);
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) return { error: `Stock for ${size} must be a whole number.` };
      await setStock(productId, size, n);
    }
  }
  revalidatePath("/admin/inventory");
  return { ok: "Saved" };
}

export async function refreshCatalog() {
  await requireAdmin();
  invalidateCatalog();
  revalidatePath("/admin/inventory");
}
