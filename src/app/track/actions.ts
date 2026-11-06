"use server";

import { z } from "zod";
import { findOrderForTracking } from "@/lib/orders";
import { getReturnsForOrder, returnableQuantities, returnEligibility } from "@/lib/returns";
import type { Order, OrderItem, ReturnRequest } from "@/lib/db/schema";

export type TrackResult =
  | {
      error?: undefined;
      email: string;
      order: Order;
      items: OrderItem[];
      returns: ReturnRequest[];
      returnable: Record<string, number>;
      returnDeadline: string | null;
    }
  | { error: string }
  | undefined;

const Form = z.object({
  number: z
    .string()
    .trim()
    .transform((v) => v.replace(/^#/, ""))
    .pipe(z.string().regex(/^\d{1,9}$/, "Enter your order number, e.g. 1001")),
  email: z.string().trim().email("Enter the email you ordered with"),
});

export async function trackOrder(_: TrackResult, form: FormData): Promise<TrackResult> {
  const parsed = Form.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const found = await findOrderForTracking(Number(parsed.data.number), parsed.data.email);
  // Same message either way, so the form can't be used to discover orders.
  if (!found) return { error: "We couldn't find an order with that number and email." };
  const { order, items } = found;
  const eligible = returnEligibility(order);
  const qty = await returnableQuantities(order, items);
  return {
    email: parsed.data.email,
    order: { ...order, stripePaymentIntentId: null, stripeSessionId: null, notes: null, giftCardId: null },
    items,
    returns: await getReturnsForOrder(order.id),
    returnable: Object.fromEntries(qty),
    returnDeadline: eligible.ok ? new Date(eligible.deadline).toISOString() : null,
  };
}
