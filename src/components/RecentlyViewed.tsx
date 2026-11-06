"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRecentlyViewed, type SavedProduct } from "@/store/saved";
import { useMounted } from "@/lib/use-mounted";
import { Price } from "./Price";
import { useT } from "./Prefs";

/** Drop on a product page to record the view. */
export function RecordView({ product }: { product: SavedProduct }) {
  const record = useRecentlyViewed((s) => s.record);
  useEffect(() => record(product), [record, product]);
  return null;
}

export function RecentlyViewed({ excludeId, title }: { excludeId?: string; title?: string }) {
  const t = useT();
  const mounted = useMounted();
  const items = useRecentlyViewed((s) => s.items).filter((i) => i.id !== excludeId).slice(0, 6);
  if (!mounted || items.length === 0) return null;
  return (
    <section className="section-y border-t border-black/10">
      <div className="container-x">
        <h2 className="eyebrow mb-6">{title ?? t("recent.title")}</h2>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {items.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group w-[42vw] shrink-0 snap-start sm:w-auto">
              <div className="relative aspect-square bg-stone">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="200px" className="object-contain transition-transform group-hover:scale-105" />}
              </div>
              <p className="mt-3 truncate text-[13px]">{p.name}</p>
              <Price amount={p.unitAmount} compareAt={p.compareAtAmount} currency={p.currency} className="text-[13px]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
