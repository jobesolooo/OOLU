import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { attachGiftCardSession, createPendingGiftCard, GIFT_CARD_AMOUNTS } from "@/lib/giftcards";
import { site } from "@/lib/site";
import { DEFAULT_CURRENCY, formatMoneyShort } from "@/lib/format";
import { getLocale, stripeLocale } from "@/i18n/server";

const Body = z.object({
  amount: z.number().int().refine((a) => GIFT_CARD_AMOUNTS.includes(a), "Pick an amount"),
  recipientEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  recipientName: z.string().trim().max(80).optional(),
  senderName: z.string().trim().max(80).optional(),
  message: z.string().trim().max(400).optional(),
});

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments aren't connected yet." }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const d = parsed.data;

  const card = await createPendingGiftCard({
    amount: d.amount,
    currency: DEFAULT_CURRENCY,
    recipientEmail: d.recipientEmail || null,
    recipientName: d.recipientName || null,
    senderName: d.senderName || null,
    message: d.message || null,
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      // Stripe's payment page in the shopper's language.
      locale: stripeLocale(await getLocale()),
      metadata: { kind: "giftcard", giftCardId: card.id },
      payment_intent_data: { metadata: { kind: "giftcard", giftCardId: card.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DEFAULT_CURRENCY,
            unit_amount: d.amount,
            product_data: {
              name: `${site.name} digital gift card — ${formatMoneyShort(d.amount)}`,
              description: d.recipientEmail ? `Emailed to ${d.recipientEmail}` : "Emailed to you after purchase",
            },
          },
        },
      ],
      success_url: `${origin}/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gift-cards`,
    });
    await attachGiftCardSession(card.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[gift-cards] Stripe error", err);
    return NextResponse.json({ error: "We couldn't start checkout. Try again in a moment." }, { status: 502 });
  }
}
