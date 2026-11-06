"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { findOrderForTracking, getOrder } from "@/lib/orders";
import { refundForLines, RETURN_REASONS, returnableQuantities, returnEligibility } from "@/lib/returns";
import { sendReturnUpdate } from "@/lib/email";

export type ReturnState = { ok?: string; error?: string } | undefined;

const Form = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.coerce.number().int().optional(),
  email: z.string().email().optional().or(z.literal("")),
  reason: z.enum(RETURN_REASONS),
  comment: z.string().trim().max(1000).optional(),
});

export async function requestReturn(_: ReturnState, form: FormData): Promise<ReturnState> {
  const parsed = Form.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Pick a reason for the return." };
  const d = parsed.data;

  // Authorise: either the signed-in owner, or order number + email (tracking page).
  const user = await getCurrentUser();
  let data = await getOrder(d.orderId);
  if (!data) return { error: "Order not found." };
  const ownsIt = user && data.order.userId === user.id;
  if (!ownsIt) {
    if (!d.orderNumber || !d.email) return { error: "Please sign in or look up your order first." };
    const viaTracking = await findOrderForTracking(d.orderNumber, d.email);
    if (!viaTracking || viaTracking.order.id !== d.orderId) return { error: "We couldn't verify this order." };
    data = viaTracking;
  }
  const { order, items } = data;

  const eligible = returnEligibility(order);
  if (!eligible.ok) return { error: eligible.reason };

  const available = await returnableQuantities(order, items);
  const lines = items
    .map((i) => ({ orderItemId: i.id, quantity: Math.floor(Number(form.get(`qty:${i.id}`) ?? 0)) }))
    .filter((l) => l.quantity > 0);
  if (!lines.length) return { error: "Choose at least one item to return." };
  for (const l of lines) {
    if (l.quantity > (available.get(l.orderItemId) ?? 0)) return { error: "One of those items can't be returned in that quantity." };
  }

  const db = await getDb();
  await db.insert(schema.returnRequests).values({
    orderId: order.id,
    userId: order.userId,
    reason: d.reason,
    comment: d.comment || null,
    items: lines,
    refundAmount: refundForLines(items, lines),
  });
  await sendReturnUpdate(order.email, order.number, "requested");
  revalidatePath(`/account/orders/${order.id}`);
  return { ok: "Return requested. We'll email you within 1–2 business days with next steps." };
}
