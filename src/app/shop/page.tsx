import Link from "next/link";
import type { Metadata } from "next";
import { queryProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/site";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { cx } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

const SORTS = [
  { value: "", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const category = one(sp.category);
  const collection = one(sp.collection);
  const sort = one(sp.sort);
  const products = await queryProducts({ category, collection, sort });

  const title = collection
    ? (COLLECTIONS[collection]?.title ?? collection)
    : category
      ? (CATEGORIES.find((c) => c.slug === category)?.label ?? category)
      : sort === "new"
        ? "New Arrivals"
        : "Shop All";

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { category, collection, sort, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <PageHeader eyebrow={collection ? "Collection" : "Streetwear / Culture / You"} title={title} />
      <div className="container-x py-8">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-2" aria-label="Categories">
            {[{ slug: undefined, label: "All" }, ...CATEGORIES].map((c) => (
              <Link
                key={c.label}
                href={href({ category: c.slug, collection: undefined })}
                className={cx(
                  "border px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase transition-colors",
                  category === c.slug && !collection ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
                )}
              >
                {c.label}
              </Link>
            ))}
          </nav>
          <form className="flex items-center gap-3" action="/shop">
            {category && <input type="hidden" name="category" value={category} />}
            {collection && <input type="hidden" name="collection" value={collection} />}
            <label htmlFor="sort" className="label text-[10px] text-ash">
              Sort
            </label>
            <select id="sort" name="sort" defaultValue={sort ?? ""} className="input w-auto py-2 text-xs">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="btn-solid py-2.5">Apply</button>
          </form>
        </div>

        <p className="mt-5 mb-4 text-xs text-ash">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-ash">Nothing here yet.</p>
            <Link href="/shop" className="btn-solid mt-6">
              View everything
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
