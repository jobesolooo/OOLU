import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { queryProducts } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { CATEGORIES, site } from "@/lib/site";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { cx } from "@/lib/format";
import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.shop") };
}

const SORTS = [
  { value: "", label: "shop.sortFeatured" },
  { value: "new", label: "shop.sortNew" },
  { value: "price-asc", label: "shop.sortAsc" },
  { value: "price-desc", label: "shop.sortDesc" },
] as const;

/** Hero photo per category; everything else uses the tracksuit duo. */
const HERO: Record<string, { src: string; position: string }> = {
  "t-shirts": { src: "/images/brand/look-friends.jpg", position: "center 35%" },
  "sleeveless-and-tanks": { src: "/images/brand/story-roots.jpg", position: "center 40%" },
  tracksuits: { src: "/images/brand/hero.jpg", position: "center 30%" },
  hoodies: { src: "/images/brand/tracksuit-duo.jpg", position: "center 20%" },
  default: { src: "/images/brand/tracksuit-duo-2.jpg", position: "center 30%" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const { t } = await getT();
  const category = one(sp.category);
  const collection = one(sp.collection);
  const sort = one(sp.sort);
  const sale = one(sp.sale) === "1";
  const [products, ratings, all] = await Promise.all([
    queryProducts({ category, collection, sort, sale }),
    getRatingsMap(),
    queryProducts({}),
  ]);

  const known = (slug?: string) => CATEGORIES.some((c) => c.slug === slug);
  const title = collection
    ? known(collection)
      ? t(`cat.${collection}` as MessageKey)
      : (COLLECTIONS[collection]?.title ?? collection)
    : sale
      ? t("shop.sale")
      : category
        ? known(category)
          ? t(`cat.${category}` as MessageKey)
          : category
        : sort === "new"
          ? t("shop.newArrivals")
          : t("shop.all");
  const hero = HERO[category ?? collection ?? ""] ?? HERO.default;
  const counts: Record<string, number> = {};
  for (const p of all) counts[p.category] = (counts[p.category] ?? 0) + 1;

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { category, collection, sort, sale: sale ? "1" : undefined, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };
  const currentSort = SORTS.find((s) => s.value === (sort ?? "")) ?? SORTS[0];

  const pills = [
    { key: "all", label: t("shop.allShort"), href: href({ category: undefined, collection: undefined, sale: undefined }), active: !category && !collection && !sale, count: all.length, thumb: null as string | null },
    ...CATEGORIES.filter((c) => counts[c.slug]).map((c) => ({
      key: c.slug,
      label: t(`cat.${c.slug}` as MessageKey),
      href: href({ category: c.slug, collection: undefined, sale: undefined }),
      active: category === c.slug && !collection && !sale,
      count: counts[c.slug],
      thumb: site.categories.find((x) => x.slug === c.slug)?.image ?? null,
    })),
  ];

  // An editorial tile breaks up the grid after the first two rows.
  const promoAt = products.length > 8 && !category && !sale ? 8 : -1;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[var(--nav-h)] overflow-hidden bg-ink text-white">
        <div className="parallax absolute inset-0 -z-20">
          <Image src={hero.src} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: hero.position }} />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,6,0.88),rgba(6,6,6,0.45)_55%,rgba(6,6,6,0.25)),linear-gradient(0deg,rgba(6,6,6,0.85),transparent_60%)]" />
        <p
          aria-hidden
          className="drift pointer-events-none absolute top-1/2 left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(165,146,255,0.22)]"
          style={{ fontSize: "clamp(200px, 30vw, 480px)" }}
        >
          OOLU OOLU OOLU
        </p>
        <div className="container-x flex min-h-[min(62svh,600px)] flex-col justify-end pt-32 pb-[clamp(40px,5vw,72px)]">
          <p className="rise text-[11px] tracking-[0.14em] text-accent uppercase" style={{ "--delay": "100ms" } as React.CSSProperties}>
            {collection ? t("shop.collection") : t("nav.catalog")} · {t(products.length === 1 ? "shop.countOne" : "shop.count", { count: products.length })}
          </p>
          <h1 className="rise mt-4 font-display text-[clamp(56px,9vw,150px)] leading-[0.9] tracking-[-0.04em]" style={{ "--delay": "200ms" } as React.CSSProperties}>
            {title}
          </h1>
          <p className="rise mt-5 max-w-[480px] text-[13px] leading-[1.7] text-white/75" style={{ "--delay": "320ms" } as React.CSSProperties}>
            {t("shop.heroBody")}
          </p>
        </div>
      </section>

      {/* Sticky toolbar: category pills with thumbnails (scrolls sideways) + sort menu */}
      <div className="sticky top-[var(--nav-h)] z-20 border-b border-black/10 bg-mist/95 backdrop-blur">
        <div className="container-x flex items-center gap-4 py-3">
          <nav className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label={t("shop.categories")}>
            {pills.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                scroll={false}
                className={cx(
                  "group flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pr-4 text-[11px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors",
                  p.thumb ? "pl-1.5" : "pl-4",
                  p.active ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:border-ink",
                )}
              >
                {p.thumb && (
                  <span className="relative size-7 overflow-hidden rounded-full bg-stone">
                    <Image src={p.thumb} alt="" fill sizes="28px" className="object-cover transition-transform duration-500 group-hover:scale-125" />
                  </span>
                )}
                {p.label}
                <span className={cx("tabular-nums", p.active ? "text-white/60" : "text-ash")}>{p.count}</span>
              </Link>
            ))}
            <Link
              href={href({ sale: sale ? undefined : "1", category: undefined, collection: undefined })}
              scroll={false}
              className={cx(
                "flex shrink-0 items-center rounded-full border px-4 py-1.5 text-[11px] tracking-[0.06em] uppercase transition-colors",
                sale ? "border-accent bg-accent text-ink" : "border-accent/60 text-[#6b54e0] hover:bg-accent hover:text-ink",
              )}
            >
              {t("shop.sale")}
            </Link>
          </nav>

          <details className="group relative shrink-0">
            <summary className="flex items-center gap-2 border border-black/15 bg-white px-4 py-2.5 text-[11px] tracking-[0.06em] uppercase hover:border-ink">
              <span className="hidden sm:inline">{t("shop.sortBy", { sort: t(currentSort.label) })}</span>
              <span className="sm:hidden">{t("shop.sort")}</span>
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" strokeWidth={1.5} />
            </summary>
            <ul className="animate-fade-down absolute right-0 z-30 mt-2 w-60 border border-black/10 bg-white p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]">
              {SORTS.map((s) => (
                <li key={s.value}>
                  <Link
                    href={href({ sort: s.value || undefined })}
                    scroll={false}
                    className="flex items-center justify-between px-3 py-2.5 text-[12px] hover:bg-stone"
                  >
                    {t(s.label)}
                    {s === currentSort && <Check className="size-3.5" />}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* Grid */}
      <section className="bg-mist py-[clamp(32px,4vw,64px)]">
        <div className="container-x">
          {products.length ? (
            <div data-reveal="stagger" className="grid grid-cols-2 gap-x-[clamp(8px,0.9vw,16px)] gap-y-[clamp(32px,3vw,52px)] lg:grid-cols-4">
              {products.flatMap((p, i) => {
                const card = <ProductCard key={p.id} product={p} priority={i < 4} rating={ratings.get(p.id)} />;
                if (i !== promoAt) return [card];
                return [
                  <Link
                    key="promo"
                    href="/products/oolu-tracksuit"
                    className="group relative isolate col-span-2 flex min-h-[420px] items-end overflow-hidden bg-ink text-white lg:row-span-1"
                  >
                    <Image src="/images/brand/made-to-move.jpg" alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="-z-20 object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <span className="float absolute top-5 right-5 grid size-20 place-items-center rounded-full bg-accent text-ink">
                      <span className="font-wordmark text-[26px] leading-none">-25%</span>
                    </span>
                    <div className="p-[clamp(20px,2.6vw,40px)]">
                      <p className="text-[11px] tracking-[0.14em] text-accent uppercase">{t("shop.promoKicker")}</p>
                      <p className="mt-3 font-display text-[clamp(36px,3.6vw,60px)] leading-[0.95] tracking-[-0.03em]">{t("shop.promoTitle")}</p>
                      <p className="mt-3 max-w-[360px] text-[13px] leading-[1.6] text-white/80">{t("shop.promoBody")}</p>
                      <span className="mt-5 inline-flex items-center gap-3 bg-white px-5 py-3 text-[11px] tracking-[0.08em] text-ink uppercase">
                        {t("common.shopNow")} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
                      </span>
                    </div>
                  </Link>,
                  card,
                ];
              })}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-display text-[40px] tracking-[-0.02em]">{t("shop.empty")}</p>
              <Link href="/shop" className="btn-solid mt-8">
                {t("shop.viewEverything")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
