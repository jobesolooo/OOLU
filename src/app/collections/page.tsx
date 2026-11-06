import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const products = await getProducts();
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    if (!p.collection) continue;
    groups.set(p.collection, [...(groups.get(p.collection) ?? []), p]);
  }

  return (
    <>
      <PageHeader eyebrow="Find your fit" title="Collections" />
      <div className="container-x grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {[...groups.entries()].map(([slug, items]) => {
          const meta = COLLECTIONS[slug] ?? { title: slug.replace(/-/g, " "), blurb: "" };
          return (
            <Link key={slug} href={`/shop?collection=${slug}`} className="group block bg-white">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone">
                {items[0]?.images[0] && (
                  <Image
                    src={items[0].images[0]}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 33vw, 50vw"
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex items-end justify-between gap-4 p-5">
                <div>
                  <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">{meta.title}</h2>
                  {meta.blurb && <p className="mt-1 text-xs text-ash">{meta.blurb}</p>}
                  <p className="mt-2 text-[10px] tracking-[0.14em] text-ash uppercase">
                    {items.length} {items.length === 1 ? "piece" : "pieces"}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
