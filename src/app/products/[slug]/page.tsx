import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Leaf, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { shippingConfig } from "@/lib/shipping";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stockMap = await getStockMap([product.id]);
  const stock: Record<string, number> = {};
  for (const s of product.sizes) {
    const v = stockMap.get(stockKey(product.id, s));
    if (v !== undefined) stock[s] = v;
  }

  const related = (await getProducts())
    .filter((p) => p.id !== product.id && (p.collection === product.collection || p.category === product.category))
    .slice(0, 4);
  const { freeShippingThreshold } = shippingConfig();
  const collection = product.collection ? COLLECTIONS[product.collection] : null;

  return (
    <>
      <div className="container-x py-6 text-[10px] tracking-[0.14em] text-ash uppercase">
        <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link> <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </div>

      <div className="container-x grid gap-10 pb-16 md:grid-cols-[1.15fr_1fr] md:gap-14">
        <div className="grid gap-3">
          {(product.images.length ? product.images : [null]).map((src, i) => (
            <div key={src ?? i} className="relative aspect-square bg-stone">
              {src && (
                <Image src={src} alt={`${product.name}${i ? ` view ${i + 1}` : ""}`} fill priority={i === 0} sizes="(min-width:768px) 55vw, 100vw" className="object-contain" />
              )}
            </div>
          ))}
        </div>

        <div className="md:sticky md:top-28 md:self-start">
          {collection && (
            <Link href={`/shop?collection=${product.collection}`} className="text-[10px] tracking-[0.3em] text-ash uppercase hover:text-ink">
              {collection.title}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl leading-tight font-[800] uppercase md:text-4xl">{product.name}</h1>
          <p className="mt-3 text-lg">{formatMoney(product.unitAmount, product.currency)}</p>
          <p className="mt-6 text-sm leading-relaxed text-black/75">{product.description}</p>

          <div className="mt-8">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0] ?? null,
                unitAmount: product.unitAmount,
                currency: product.currency,
                sizes: product.sizes,
              }}
              stock={stock}
            />
          </div>

          <ul className="mt-10 space-y-3 border-t border-black/10 pt-6 text-xs">
            <li className="flex items-center gap-3"><Truck className="size-4" strokeWidth={1.3} /> Free shipping over {formatMoneyShort(freeShippingThreshold)}, worldwide delivery</li>
            <li className="flex items-center gap-3"><RefreshCw className="size-4" strokeWidth={1.3} /> Hassle-free 30-day returns</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-4" strokeWidth={1.3} /> Secure checkout with Stripe</li>
            <li className="flex items-center gap-3"><Leaf className="size-4" strokeWidth={1.3} /> Premium quality, built to last</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-black/10 bg-mist py-10">
          <div className="container-x">
            <h2 className="mb-4 text-[11px] font-medium tracking-[0.3em] uppercase">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
