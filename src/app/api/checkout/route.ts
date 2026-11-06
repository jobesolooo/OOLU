import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { getProducts } from "@/lib/catalog";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getStockMap, stockKey } from "@/lib/inventory";
import { attachCheckoutSession, createPendingOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { shippingConfig } from "@/lib/shipping";
import { MAX_QTY } from "@/lib/constants";

const Body = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        size: z.string().max(40),
        quantity: z.number().int().min(1).max(MAX_QTY),
      }),
    )
    .min(1)
    .max(50),
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return fail("Payments aren't connected yet. Add STRIPE_SECRET_KEY to the environment.", 503);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Your bag looks invalid. Try refreshing the page.");

  // Never trust prices from the browser: look everything up again server-side.
  const catalog = new Map((await getProducts()).map((p) => [p.id, p]));
  const merged = new Map<string, { productId: string; size: string; quantity: number }>();
  for (const item of parsed.data.items) {
    const key = stockKey(item.productId, item.size);
    const prev = merged.get(key);
    merged.set(key, { ...item, quantity: Math.min(MAX_QTY, (prev?.quantity ?? 0) + item.quantity) });
  }

  const stock = await getStockMap([...new Set([...merged.values()].map((i) => i.productId))]);
  const orderItems = [];
  for (const item of merged.values()) {
    const product = catalog.get(item.productId);
    if (!product) return fail("An item in your bag is no longer available. Please remove it and try again.", 409);
    if (product.isDemo) return fail("This store still shows demo products. Add products in Stripe (or run `npm run stripe:seed`).", 409);
    if (!product.sizes.includes(item.size)) return fail(`Size ${item.size} isn't available for ${product.name}.`, 409);
    const left = stock.get(stockKey(product.id, item.size));
    if (left !== undefined && left < item.quantity) {
      return fail(
        left <= 0
          ? `${product.name} (${item.size}) just sold out.`
          : `Only ${left} left of ${product.name} (${item.size}). Please lower the quantity.`,
        409,
      );
    }
    orderItems.push({
      productId: product.id,
      priceId: product.priceId,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      unitAmount: product.unitAmount,
      image: product.images[0] ?? null,
      currency: product.currency,
    });
  }

  const currency = orderItems[0].currency;
  if (orderItems.some((i) => i.currency !== currency)) return fail("Mixed currencies in one order aren't supported.");

  const user = await getCurrentUser();
  const order = await createPendingOrder({
    userId: user?.id ?? null,
    email: user?.email ?? null,
    currency,
    items: orderItems.map((i) => ({ ...i, currency: undefined })),
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const subtotal = orderItems.reduce((s, i) => s + i.unitAmount * i.quantity, 0);
  const ship = shippingConfig();
  const freeShipping = ship.freeShippingThreshold > 0 && subtotal >= ship.freeShippingThreshold;

  const shippingRate = (name: string, amount: number, min: number, max: number): Stripe.Checkout.SessionCreateParams.ShippingOption => ({
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: name,
      fixed_amount: { amount, currency },
      delivery_estimate: { minimum: { unit: "business_day", value: min }, maximum: { unit: "business_day", value: max } },
      tax_behavior: "exclusive",
    },
  });

  const toAbsolute = (src: string) => (src.startsWith("http") ? src : null); // Stripe needs public https images

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      payment_intent_data: { metadata: { orderId: order.id } },
      ...(user?.email ? { customer_email: user.email } : {}),
      line_items: orderItems.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency,
          unit_amount: i.unitAmount,
          tax_behavior: "exclusive",
          product_data: {
            name: i.size && i.size !== "One Size" ? `${i.name} — ${i.size}` : i.name,
            images: i.image && toAbsolute(i.image) ? [i.image] : undefined,
            metadata: { productId: i.productId, size: i.size ?? "" },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ship.countries },
      shipping_options: freeShipping
        ? [shippingRate("Free shipping", 0, 3, 7)]
        : [shippingRate("Standard shipping", ship.flatRate, 3, 7)],
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });
    await attachCheckoutSession(order.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error", err);
    return fail("We couldn't start checkout. Please try again in a moment.", 502);
  }
}
