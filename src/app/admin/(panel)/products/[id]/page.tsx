import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { site } from "@/lib/site";
import { isStripeConfigured } from "@/lib/stripe";
import { getAdminProduct, listAdminProducts } from "@/lib/stripe-products";
import { COLLECTIONS } from "@/lib/demo-catalog";
import { AdminHeader, ghostBtn } from "../../ui";
import { ProductEditor, type EditorProduct } from "../ProductEditor";
import { removeProduct, toggleProductActive } from "../actions";

/** ms → "YYYY-MM-DDTHH:mm" in Amsterdam time, for <input type="datetime-local">. */
function toAmsterdamLocal(ms: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(ms)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const euros = (c: number | null) => (c ? (c % 100 ? (c / 100).toFixed(2) : String(c / 100)) : "");

export default async function ProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isStripeConfigured()) redirect("/admin/products");
  const isNew = id === "new";
  const [p, all] = await Promise.all([isNew ? null : getAdminProduct(id), listAdminProducts().catch(() => [])]);
  if (!isNew && !p) notFound();

  const categories = [...new Set([...site.categories.map((c) => c.slug), ...all.map((x) => x.category)])];
  const collections = [...new Set([...Object.keys(COLLECTIONS), ...all.map((x) => x.collection).filter(Boolean)])];

  const product: EditorProduct = p
    ? {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.hasPrice ? euros(p.unitAmount) : "",
        compareAt: euros(p.compareAtAmount),
        slug: p.slug,
        category: p.category,
        collection: p.collection,
        sizes: p.sizes.filter((s) => s !== "One Size"),
        featured: p.featured,
        isNew: p.isNew,
        sort: p.sort === 999 ? "" : String(p.sort),
        group: p.group ?? "",
        color: p.color ?? "",
        colorHex: p.colorHex ?? "",
        releaseAt: p.releaseAt ? toAmsterdamLocal(p.releaseAt) : "",
        details: p.details.join("\n"),
        colors: p.colors,
        images: p.images,
        active: p.active,
      }
    : {
        id: "",
        name: "",
        description: "",
        price: "",
        compareAt: "",
        slug: "",
        category: categories[0] ?? "t-shirts",
        collection: "",
        sizes: ["S", "M", "L"],
        featured: false,
        isNew: true,
        sort: "",
        group: "",
        color: "",
        colorHex: "",
        releaseAt: "",
        details: "",
        colors: [],
        images: [],
        active: true,
      };

  return (
    <>
      <Link href="/admin/products" className="group mb-4 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-ash uppercase hover:text-ink">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Products
      </Link>
      <AdminHeader
        eyebrow={isNew ? "New product" : p!.active ? "Live on the store" : "Archived"}
        title={isNew ? "New product" : p!.name}
        description={sp.created ? "Created in Stripe and live on the store." : undefined}
        actions={
          !isNew && (
            <>
              {p!.active && (
                <a href={`/products/${p!.slug}`} target="_blank" rel="noreferrer" className={ghostBtn}>
                  View on store ↗
                </a>
              )}
              <form action={toggleProductActive}>
                <input type="hidden" name="id" value={p!.id} />
                <input type="hidden" name="active" value={String(!p!.active)} />
                <button className={ghostBtn}>{p!.active ? "Archive" : "Restore"}</button>
              </form>
              {!p!.active && (
                <form action={removeProduct}>
                  <input type="hidden" name="id" value={p!.id} />
                  <button className={`${ghostBtn} border-rose-200 text-rose-700 hover:border-rose-600`}>Delete</button>
                </form>
              )}
            </>
          )
        }
      />
      <ProductEditor key={p?.id ?? "new"} product={product} categories={categories} collections={collections} dashboardUrl={p?.dashboardUrl ?? null} />
    </>
  );
}
