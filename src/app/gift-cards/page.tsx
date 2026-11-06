import type { Metadata } from "next";
import { GIFT_CARD_AMOUNTS } from "@/lib/giftcards";
import { PageHeader } from "@/components/PageHeader";
import { GiftCardForm } from "./GiftCardForm";

export const metadata: Metadata = { title: "Gift cards", description: "Digital Wstablished gift cards, delivered by email." };

export default function GiftCardsPage() {
  return (
    <>
      <PageHeader eyebrow="Delivered instantly by email" title="Gift cards" />
      <div className="container-x section-y grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div className="grain relative flex aspect-[1.6/1] flex-col justify-between overflow-hidden bg-ink p-8 text-white sm:p-10">
          <div className="flex items-center gap-5">
            <span className="font-serif text-5xl font-black">W</span>
            <span className="text-xs tracking-[0.42em]">WSTABLISHED</span>
          </div>
          <div>
            <p className="eyebrow text-white/60">Gift card</p>
            <p className="mt-2 font-script text-5xl">For the real ones</p>
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
