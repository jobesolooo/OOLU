"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
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
      <div className="py-16 text-center">
        <p className="text-[15px] text-ash">{t("wishlist.empty")}</p>
        <Link href="/shop" className="btn-solid mt-8">{t("common.shopNow")}</Link>
      </div>
    );
  }
  return (
    <>
      <p className="mb-6 text-sm text-ash">
        {t("wishlist.count", { count: items.length })}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.id} className="group relative">
            <Link href={`/products/${p.slug}`}>
              <div className="relative aspect-[1/0.9] bg-stone">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="25vw" className="object-contain" />}
              </div>
              <p className="mt-4 truncate text-[14px] font-medium">{p.name}</p>
              <Price amount={p.unitAmount} compareAt={p.compareAtAmount} currency={p.currency} className="text-[14px]" />
            </Link>
            <button
              onClick={() => remove(p.id)}
              aria-label={t("wishlist.remove", { name: p.name })}
              className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm"
            >
              <X className="size-4" />
            </button>
            <Link href={`/products/${p.slug}`} className="btn-solid mt-4 w-full py-3">
              {t("wishlist.chooseSize")}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
