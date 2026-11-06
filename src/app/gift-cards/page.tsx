import type { Metadata } from "next";
import { GIFT_CARD_AMOUNTS } from "@/lib/giftcards";
import { PageHeader } from "@/components/PageHeader";
import { GiftCardForm } from "./GiftCardForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("gift.meta"), description: t("gift.metaDesc") };
}

export default async function GiftCardsPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("gift.eyebrow")} title={t("gift.title")} subtitle={t("gift.subtitle")} image="/images/brand/look-friends.jpg" imagePosition="center 35%" word="GIFT" />
      <div className="container-x py-[clamp(48px,6vw,96px)]">
        <GiftCardForm amounts={GIFT_CARD_AMOUNTS} />
      </div>
    </>
  );
}
