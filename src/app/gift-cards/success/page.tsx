import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { activatePurchasedGiftCard } from "@/lib/giftcards";
import { getDb, schema } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gift card sent", robots: { index: false } };

export default async function GiftCardSuccess({ searchParams }: PageProps<"/gift-cards/success">) {
  const raw = (await searchParams).session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  let card = null;
  if (sessionId) {
    const db = await getDb();
    [card] = await db.select().from(schema.giftCards).where(eq(schema.giftCards.stripeSessionId, sessionId)).limit(1);
    if (card?.status === "pending" && isStripeConfigured()) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        card = (await activatePurchasedGiftCard(session)) ?? card;
      } catch (err) {
        console.error("[gift-card success] verify failed", err);
      }
    }
  }

  return (
    <div className="container-x section-y max-w-2xl">
      <p className="eyebrow text-ash">Gift card</p>
      <h1 className="h-display mt-4">{card?.status === "active" ? "It's on its way." : "Thanks!"}</h1>
      <p className="mt-6 text-[15px] leading-relaxed text-black/75">
        {card?.status === "active"
          ? `We've emailed the ${formatMoney(card.initialAmount, card.currency)} gift card to ${card.recipientEmail ?? card.purchaserEmail ?? "you"}.`
          : "Your payment is being confirmed. The gift card will be emailed as soon as it clears."}
      </p>
      <Link href="/shop" className="btn-solid mt-10">Keep shopping</Link>
    </div>
  );
}
