import type { Metadata } from "next";
import Image from "next/image";
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
      <PageHeader eyebrow={t("gift.eyebrow")} title={t("gift.title")} />
      <div className="container-x section-y grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative flex aspect-[1.6/1] flex-col justify-between overflow-hidden bg-ink p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-[12%] -bottom-[30%] w-[70%] opacity-90" aria-hidden>
            <Image src="/images/brand/logo-mark.png" alt="" width={363} height={343} className="h-auto w-full" />
          </div>
          <span className="relative font-wordmark text-5xl leading-none tracking-[0.04em]">OOLU</span>
          <div className="relative">
            <p className="eyebrow text-accent">{t("gift.card")}</p>
            <p className="mt-2 font-display text-5xl tracking-[-0.02em]">{t("brand.established")}</p>
          </div>
        </div>
        <div>
          <p className="text-[15px] leading-relaxed text-black/75">
            {t("gift.intro")}
          </p>
          <GiftCardForm amounts={GIFT_CARD_AMOUNTS} />
        </div>
      </div>
    </>
  );
}
