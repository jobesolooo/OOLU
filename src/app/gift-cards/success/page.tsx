import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { activatePurchasedGiftCard } from "@/lib/giftcards";
import { getDb, schema } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("gift.sentMeta"), robots: { index: false } };
}

export default async function GiftCardSuccess({ searchParams }: PageProps<"/gift-cards/success">) {
  const raw = (await searchParams).session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  let card = null;
  const { t } = await getT();
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
      <p className="eyebrow text-ash">{t("gift.card")}</p>
      <h1 className="h-display mt-4">{card?.status === "active" ? t("gift.onItsWay") : t("success.thanks")}</h1>
      <p className="mt-6 text-[15px] leading-relaxed text-black/75">
        {card?.status === "active"
          ? t("gift.sentBody", { amount: formatMoney(card.initialAmount, card.currency), email: card.recipientEmail ?? card.purchaserEmail ?? t("gift.you") })
          : t("gift.pendingBody")}
      </p>
      <Link href="/shop" className="btn-solid mt-10">{t("success.keepShopping")}</Link>
    </div>
  );
}
