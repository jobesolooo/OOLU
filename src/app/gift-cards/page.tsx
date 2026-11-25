import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/PageHeader";
import { GiftCardForm } from "./GiftCardForm";
import { getT } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMeta({ path: "/gift-cards", title: t("gift.meta"), description: t("gift.metaDesc") });
}

export default async function GiftCardsPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("gift.eyebrow")} title={t("gift.title")} subtitle={t("gift.subtitle")} image="/images/brand/hoodie-set-glow.jpg" imagePosition="center 20%" word="GIFT" />
      <div className="container-x py-[clamp(48px,6vw,96px)]">
        <GiftCardForm amounts={(await getSettings()).giftCardAmounts} />
      </div>
    </>
  );
}
