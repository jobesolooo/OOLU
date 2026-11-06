import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { getProducts, isUpcoming } from "@/lib/catalog";
import { findActiveGiftCard } from "@/lib/giftcards";
import { createGiftCardCoupon } from "@/lib/promotions";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getStockMap, stockKey } from "@/lib/inventory";
import { attachCheckoutSession, createPendingOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { ensureStripeCustomer } from "@/lib/customers";
import { shippingConfig } from "@/lib/shipping";
import { MAX_QTY } from "@/lib/constants";
import { allVariantKeys, variantLabel } from "@/lib/variants";

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
  giftCardCode: z.string().max(40).optional(),
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
    if (isUpcoming(product)) return fail(`${product.name} hasn't dropped yet.`, 409);
    if (!allVariantKeys(product).includes(item.size)) return fail(`${variantLabel(item.size)} isn't available for ${product.name}.`, 409);
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

  const subtotal = orderItems.reduce((s, i) => s + i.unitAmount * i.quantity, 0);

  // Gift card: applied to the items (not shipping) as a one-off Stripe coupon.
  let giftCard: Awaited<ReturnType<typeof findActiveGiftCard>> | null = null;
  let giftCardAmount = 0;
  if (parsed.data.giftCardCode?.trim()) {
    giftCard = await findActiveGiftCard(parsed.data.giftCardCode);
    if (!giftCard || giftCard.balance <= 0) return fail("That gift card code isn't valid or has no balance left.");
    if (giftCard.currency !== currency) return fail("That gift card is in a different currency.");
    giftCardAmount = Math.min(giftCard.balance, subtotal);
  }

  const user = await getCurrentUser();
  const order = await createPendingOrder({
    userId: user?.id ?? null,
    email: user?.email ?? null,
    currency,
    items: orderItems.map((i) => ({ ...i, currency: undefined })),
    giftCardId: giftCard?.id ?? null,
    giftCardAmount,
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
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
    const customerId = user ? await ensureStripeCustomer(user) : null;
    const giftCoupon = giftCard && giftCardAmount > 0 ? await createGiftCardCoupon(giftCardAmount, currency, giftCard.code.slice(-4)) : null;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      payment_intent_data: { metadata: { orderId: order.id } },
      // Signed-in shoppers get a Stripe customer, so cards and addresses are remembered next time.
      ...(customerId
        ? {
            customer: customerId,
            customer_update: { shipping: "auto" as const, name: "auto" as const },
            saved_payment_method_options: { payment_method_save: "enabled" as const },
          }
        : {}),
      line_items: orderItems.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency,
          unit_amount: i.unitAmount,
          tax_behavior: "exclusive",
          product_data: {
            name: i.size && i.size !== "One Size" ? `${i.name} — ${variantLabel(i.size)}` : i.name,
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
      // Stripe allows either a pre-applied discount or the promo code box, not both.
      ...(giftCoupon ? { discounts: [{ coupon: giftCoupon.id }] } : { allow_promotion_codes: true }),
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
