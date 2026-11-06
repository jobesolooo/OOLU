import type { Metadata } from "next";
import Image from "next/image";
import { GIFT_CARD_AMOUNTS } from "@/lib/giftcards";
import { PageHeader } from "@/components/PageHeader";
import { GiftCardForm } from "./GiftCardForm";

export const metadata: Metadata = { title: "Gift cards", description: "Digital OOLU gift cards, delivered by email." };

export default function GiftCardsPage() {
  return (
    <>
      <PageHeader eyebrow="Delivered instantly by email" title="Gift cards" />
      <div className="container-x section-y grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative flex aspect-[1.6/1] flex-col justify-between overflow-hidden bg-ink p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-[12%] -bottom-[30%] w-[70%] opacity-90" aria-hidden>
            <Image src="/images/brand/logo-mark.png" alt="" width={363} height={343} className="h-auto w-full" />
          </div>
          <span className="relative font-wordmark text-5xl leading-none tracking-[0.04em]">OOLU</span>
          <div className="relative">
            <p className="eyebrow text-accent">Gift card</p>
            <p className="mt-2 font-display text-5xl tracking-[-0.02em]">Built on trust</p>
          </div>
        </div>
        <div>
          <p className="text-[15px] leading-relaxed text-black/75">
            Pick an amount, add a note and we&apos;ll email the code — to them, or to you to pass on. Gift cards never expire and can be used across
            multiple orders until the balance runs out.
          </p>
          <GiftCardForm amounts={GIFT_CARD_AMOUNTS} />
        </div>
      </div>
    </>
  );
}
