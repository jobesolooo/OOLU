import Link from "next/link";
import type { Metadata } from "next";
import { queryProducts } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { CATEGORIES } from "@/lib/site";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { cx } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
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

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const { t } = await getT();
  const category = one(sp.category);
  const collection = one(sp.collection);
  const sort = one(sp.sort);
  const sale = one(sp.sale) === "1";
  const [products, ratings] = await Promise.all([queryProducts({ category, collection, sort, sale }), getRatingsMap()]);

  const title = collection
    ? (CATEGORIES.some((c) => c.slug === collection) ? t(`cat.${collection}` as MessageKey) : (COLLECTIONS[collection]?.title ?? collection))
    : sale
      ? t("shop.sale")
      : category
      ? (CATEGORIES.some((c) => c.slug === category) ? t(`cat.${category}` as MessageKey) : category)
      : sort === "new"
        ? t("shop.newArrivals")
        : t("shop.all");

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { category, collection, sort, sale: sale ? "1" : undefined, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <PageHeader eyebrow={collection ? t("shop.collection") : t("shop.eyebrow")} title={title} />
      <div className="container-x py-10 md:py-14">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-2" aria-label={t("shop.categories")}>
            {[{ slug: undefined, label: t("shop.allShort") }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: t(`cat.${c.slug}` as MessageKey) }))].map((c) => (
              <Link
                key={c.label}
                href={href({ category: c.slug, collection: undefined, sale: undefined })}
                className={cx(
                  "border px-5 py-2.5 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors",
                  category === c.slug && !collection && !sale ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
                )}
              >
                {c.label}
              </Link>
            ))}
            <Link
              href={href({ sale: sale ? undefined : "1", category: undefined, collection: undefined })}
              className={cx(
                "border px-5 py-2.5 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors",
                sale ? "border-[#a3271b] bg-[#a3271b] text-white" : "border-black/15 text-[#a3271b] hover:border-[#a3271b]",
              )}
            >
              {t("shop.sale")}
            </Link>
          </nav>
          <form className="flex items-center gap-3" action="/shop">
            {category && <input type="hidden" name="category" value={category} />}
            {sale && <input type="hidden" name="sale" value="1" />}
            {collection && <input type="hidden" name="collection" value={collection} />}
            <label htmlFor="sort" className="label text-[10px] text-ash">
              {t("shop.sort")}
            </label>
            <select id="sort" name="sort" defaultValue={sort ?? ""} className="input w-auto py-2 text-xs">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </select>
            <button className="btn-solid py-2.5">{t("shop.apply")}</button>
          </form>
        </div>

        <p className="mt-6 mb-6 text-[13px] text-ash">
          {products.length === 1 ? t("shop.countOne") : t("shop.count", { count: products.length })}
        </p>
        {products.length ? (
          <div data-reveal="stagger" className="grid grid-cols-2 gap-x-[clamp(12px,1.4vw,24px)] gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} rating={ratings.get(p.id)} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-ash">{t("shop.empty")}</p>
            <Link href="/shop" className="btn-solid mt-6">
              {t("shop.viewEverything")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
