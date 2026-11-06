"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, X } from "lucide-react";
import { useWishlist } from "@/store/saved";
import { useMounted } from "@/lib/use-mounted";
import { Price } from "@/components/Price";
import { useT } from "@/components/Prefs";

export function WishlistView() {
  const t = useT();
  const mounted = useMounted();
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);

  if (!mounted) return <div className="h-64" />;
  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center py-12 text-center">
        <span className="float grid size-24 place-items-center rounded-full bg-accent/20">
          <Heart className="size-10 text-[#5a44cf]" strokeWidth={1.2} />
        </span>
        <p className="mt-8 font-display text-[clamp(32px,3.4vw,48px)] leading-none tracking-[-0.03em]">{t("wishlist.emptyTitle")}</p>
        <p className="mt-4 text-[14px] leading-[1.7] text-ash">{t("wishlist.empty")}</p>
        <Link href="/shop" className="btn-solid mt-8 gap-3">
          {t("common.shopNow")} <ArrowRight className="size-4" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <p className="text-[12px] tracking-[0.06em] text-ash uppercase">{t("wishlist.count", { count: items.length })}</p>
        <button type="button" onClick={() => items.forEach((i) => remove(i.id))} className="text-[11px] tracking-[0.08em] uppercase underline-offset-4 hover:underline">
          {t("wishlist.clear")}
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-x-[clamp(8px,0.9vw,16px)] gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p, i) => (
          <li key={p.id} className="group animate-fade-up relative" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
            <Link href={`/products/${p.slug}`} className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 31vw, 46vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
              </div>
              <p className="mt-3 text-[11px] leading-[1.45] tracking-[0.04em] uppercase sm:text-[12px]">{p.name}</p>
              <Price amount={p.unitAmount} compareAt={p.compareAtAmount} currency={p.currency} className="mt-1 text-[12px]" />
            </Link>
            <button
              onClick={() => remove(p.id)}
              aria-label={t("wishlist.remove", { name: p.name })}
              className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm transition-transform hover:rotate-90"
            >
              <X className="size-4" />
            </button>
            <Link href={`/products/${p.slug}`} className="mt-3 flex w-full items-center justify-center gap-2 border border-ink py-3 text-[11px] tracking-[0.08em] uppercase transition-colors hover:bg-ink hover:text-white">
              {t("wishlist.chooseSize")} <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
