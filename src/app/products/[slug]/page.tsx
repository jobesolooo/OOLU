import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Leaf, Plus, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getProducts, getVariants, isUpcoming } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { getApprovedReviews, getRatingsMap, getUserReview, summarize } from "@/lib/reviews";
import { getCurrentUser } from "@/lib/auth";
import { COLLECTIONS, SIZE_GUIDES } from "@/lib/demo-catalog";
import { cx, formatMoneyShort } from "@/lib/format";
import { shippingConfig } from "@/lib/shipping";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import { AddToCart } from "@/components/AddToCart";
import { PaymentIcons } from "@/components/PaymentIcons";
import { ProductCard, toSaved } from "@/components/ProductCard";
import { Price, Stars } from "@/components/Price";
import { Countdown } from "@/components/Countdown";
import { Gallery } from "@/components/product/Gallery";
import { Reviews } from "@/components/product/Reviews";
import { RecentlyViewed, RecordView } from "@/components/RecentlyViewed";
import { allVariantKeys } from "@/lib/variants";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [stockMap, variants, reviews, ratings, user, all] = await Promise.all([
    getStockMap([product.id]),
    getVariants(product),
    getApprovedReviews([product.id]),
    getRatingsMap(),
    getCurrentUser(),
    getProducts(),
  ]);
  const stock: Record<string, number> = {};
  const keys = allVariantKeys(product);
  for (const s of keys) {
    const v = stockMap.get(stockKey(product.id, s));
    if (v !== undefined) stock[s] = v;
  }
  const summary = summarize(reviews);
  const alreadyReviewed = user ? Boolean(await getUserReview(user.id, product.id)) : false;
  const upcoming = isUpcoming(product);

  const related = all
    .filter((p) => p.id !== product.id && p.group !== product.group && (p.collection === product.collection || p.category === product.category))
    .slice(0, 4);
  const { freeShippingThreshold } = shippingConfig();
  const collection = product.collection ? COLLECTIONS[product.collection] : null;
  const sizeChart = SIZE_GUIDES[product.category] ?? null;
  const saved = toSaved(product);
  const allSoldOut = keys.every((s) => stock[s] !== undefined && stock[s] <= 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => (i.startsWith("http") ? i : `${SITE_URL}${i}`)),
    sku: product.id,
    brand: { "@type": "Brand", name: "OOLU" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency.toUpperCase(),
      price: (product.unitAmount / 100).toFixed(2),
      availability: upcoming
        ? "https://schema.org/PreOrder"
        : allSoldOut
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
    ...(summary.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average.toFixed(1), reviewCount: summary.count } }
      : {}),
  };

  return (
    <>
      <RecordView product={saved} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="container-x py-4 text-[11px] tracking-[0.14em] text-ash uppercase">
        <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link> <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="container-x grid gap-10 pb-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <Gallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          {collection && (
            <Link href={`/shop?collection=${product.collection}`} className="eyebrow text-ash hover:text-ink">
              {collection.title}
            </Link>
          )}
          <h1 className="mt-3 font-display font-normal tracking-[-0.02em] text-[clamp(32px,3vw,52px)] leading-[0.98]">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Price amount={product.unitAmount} compareAt={product.compareAtAmount} currency={product.currency} className="text-xl" />
            {summary.count > 0 && (
              <a href="#reviews" className="flex items-center gap-2 text-sm">
                <Stars value={summary.average} size={15} /> <span className="underline underline-offset-4">{summary.count} review{summary.count === 1 ? "" : "s"}</span>
              </a>
            )}
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-black/75">{product.description}</p>

          {variants.length > 1 && (
            <div className="mt-8">
              <p className="label mb-3 font-semibold">Colour: {product.color}</p>
              <div className="flex gap-3">
                {variants.map((v) => (
                  <Link
                    key={v.id}
                    href={`/products/${v.slug}`}
                    aria-label={v.color ?? v.name}
                    aria-current={v.id === product.id}
                    title={v.color ?? v.name}
                    className={cx("grid size-10 place-items-center rounded-full ring-offset-2", v.id === product.id ? "ring-1 ring-ink" : "hover:ring-1 hover:ring-black/30")}
                  >
                    <span className="size-8 rounded-full border border-black/10" style={{ background: v.colorHex ?? "#ccc" }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {upcoming && product.releaseAt && (
            <div className="mt-8 bg-ink p-6 text-white">
              <p className="eyebrow text-white/70">Drops in</p>
              <Countdown to={product.releaseAt} className="mt-4" />
            </div>
          )}

          <div className="mt-8">
            <AddToCart product={{ ...saved, sizes: product.sizes, colors: product.colors, variants: keys, upcoming }} stock={stock} sizeChart={sizeChart} />
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/10 pt-6 text-[13px]">
            <li className="flex items-center gap-3"><Truck className="size-4 shrink-0" strokeWidth={1.3} /> Free shipping over {formatMoneyShort(freeShippingThreshold)}</li>
            <li className="flex items-center gap-3"><RefreshCw className="size-4 shrink-0" strokeWidth={1.3} /> {RETURN_WINDOW_DAYS}-day returns</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-4 shrink-0" strokeWidth={1.3} /> Secure checkout</li>
            <li className="flex items-center gap-3"><Leaf className="size-4 shrink-0" strokeWidth={1.3} /> Built to last</li>
          </ul>
          <PaymentIcons size="sm" className="mt-5" />

          <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {product.details.length > 0 && (
              <Accordion title="Details" open>
                <ul className="list-disc space-y-1.5 pl-5">
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </Accordion>
            )}
            <Accordion title="Shipping">
              Orders ship within 1–2 business days. Standard delivery takes 3–7 business days. Free shipping on orders over{" "}
              {formatMoneyShort(freeShippingThreshold)}. <Link href="/help#shipping" className="underline">More info</Link>
            </Accordion>
            <Accordion title="Returns">
              Unworn items with tags can be returned within {RETURN_WINDOW_DAYS} days. Start a return from your account or the{" "}
              <Link href="/track" className="underline">order tracking page</Link>.
            </Accordion>
            <Accordion title="Care">Wash cold, inside out. Do not tumble dry. Iron on reverse, avoiding the print.</Accordion>
          </div>
        </div>
      </div>

      <Reviews
        reviews={reviews}
        summary={summary}
        productId={product.id}
        slug={product.slug}
        sizes={product.sizes}
        canReview={Boolean(user) && !alreadyReviewed}
        signedIn={Boolean(user)}
        alreadyReviewed={alreadyReviewed}
      />

      {related.length > 0 && (
        <section className="section-y border-t border-black/10 bg-mist">
          <div className="container-x">
            <h2 className="eyebrow mb-8">You may also like</h2>
            <div data-reveal="stagger" className="grid grid-cols-2 gap-x-[clamp(12px,1.4vw,24px)] gap-y-10 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} rating={ratings.get(p.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />
    </>
  );
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group py-4">
      <summary className="flex items-center justify-between text-[12px] font-semibold tracking-[0.14em] uppercase">
        {title}
        <Plus className="rotate-open size-4 transition-transform" strokeWidth={1.5} />
      </summary>
      <div className="pt-3 text-[14px] leading-relaxed text-black/75">{children}</div>
    </details>
  );
}
