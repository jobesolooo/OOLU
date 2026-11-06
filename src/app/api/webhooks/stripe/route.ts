import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { invalidateCatalog } from "@/lib/catalog";
import { activatePurchasedGiftCard } from "@/lib/giftcards";
import { claimEvent, markOrderCancelled, markOrderPaid, releaseEvent, syncRefund } from "@/lib/orders";

/**
 * Stripe webhook. Subscribe the endpoint to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   charge.refunded, product.created, product.updated, product.deleted,
 *   price.created, price.updated
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("Webhook not configured", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("[webhook] bad signature", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (!(await claimEvent(event))) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (event.data.object.metadata?.kind === "giftcard") await activatePurchasedGiftCard(event.data.object);
        else await markOrderPaid(event.data.object);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await markOrderCancelled(event.data.object);
        break;
      case "charge.refunded":
        await syncRefund(event.data.object);
        break;
      case "product.created":
      case "product.updated":
      case "product.deleted":
      case "price.created":
      case "price.updated":
        invalidateCatalog();
        break;
    }
  } catch (err) {
    // Let Stripe retry: forget we saw this event and report failure.
    console.error(`[webhook] failed handling ${event.type}`, err);
    await releaseEvent(event.id).catch(() => {});
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
