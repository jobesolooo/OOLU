import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { isStripeConfigured } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";
import { refreshCatalog } from "../actions";
import { StockForm } from "./StockForm";
import { allVariantKeys } from "@/lib/variants";
import { AdminHeader, Segmented, StatTile, ghostBtn } from "../ui";
import { cx } from "@/lib/format";

const LOW = 3;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "out", label: "Sold out" },
  { key: "untracked", label: "Not tracked" },
] as const;

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.filter)?.key ?? "all";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const [products, stock] = await Promise.all([getProducts(), getStockMap()]);
  const stripe = isStripeConfigured();

  const rows = products.map((p) => {
    const keys = allVariantKeys(p);
    const s: Record<string, number> = {};
    for (const k of keys) {
      const v = stock.get(stockKey(p.id, k));
      if (v !== undefined) s[k] = v;
    }
    const tracked = Object.values(s);
    return {
      p,
      keys,
      s,
      units: tracked.reduce((a, b) => a + b, 0),
      out: tracked.filter((v) => v === 0).length,
      low: tracked.filter((v) => v > 0 && v <= LOW).length,
      untracked: keys.length - tracked.length,
    };
  });
  const totals = {
    units: rows.reduce((a, r) => a + r.units, 0),
    out: rows.reduce((a, r) => a + r.out, 0),
    low: rows.reduce((a, r) => a + r.low, 0),
  };
  const shown = rows
    .filter((r) => (filter === "low" ? r.low > 0 : filter === "out" ? r.out > 0 : filter === "untracked" ? r.untracked > 0 : true))
    .filter((r) => !q || r.p.name.toLowerCase().includes(q));
  const href = (f: string) => `/admin/inventory?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <AdminHeader
        eyebrow="Catalogue"
        title="Stock"
        description="Set how many of each size you have. Leave a box empty (∞) to not track it. Stock drops automatically when an order is paid, and waiting customers are emailed when a sold-out size comes back."
        actions={
          <>
            <form action={refreshCatalog}>
              <button className={ghostBtn}>Refresh from Stripe</button>
            </form>
            {stripe && (
              <Link href="/admin/products" className="btn-solid">
                Edit products
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Units in stock" value={String(totals.units)} />
        <StatTile index={1} label={`Low (${LOW} or fewer)`} value={String(totals.low)} sub="sizes" href={href("low")} />
        <StatTile index={2} label="Sold out" value={String(totals.out)} sub="sizes" href={href("out")} />
      </div>

      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          items={FILTERS.map((f) => ({
            href: href(f.key),
            label: f.label,
            active: f.key === filter,
            count: f.key === "low" ? rows.filter((r) => r.low).length : f.key === "out" ? rows.filter((r) => r.out).length : undefined,
          }))}
        />
        <form className="flex w-full max-w-xs gap-2 sm:w-auto">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Find a product" className="input py-2.5" />
        </form>
      </div>

      {shown.length === 0 ? (
        <p className="bg-white p-10 text-center text-[13px] text-ash ring-1 ring-black/5">Nothing matches this filter.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map(({ p, keys, s, units, out, low, untracked }) => (
            <li key={p.id} className="grid grid-cols-[minmax(0,1fr)] gap-5 bg-white p-4 ring-1 ring-black/5 sm:p-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-stone">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug font-medium">
                    {stripe && !p.isDemo ? (
                      <Link href={`/admin/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      p.name
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-ash">
                    {formatMoney(p.unitAmount, p.currency)} · {p.category.replace(/-/g, " ")}
                    {p.collection && p.collection !== p.category && ` · ${p.collection.replace(/-/g, " ")}`}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1">
                    {untracked < keys.length && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] tabular-nums">{units} units</span>}
                    {out > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">{out} sold out</span>}
                    {low > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">{low} low</span>}
                    {untracked === keys.length && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-ash">Not tracked</span>}
                  </p>
                </div>
              </div>
              <StockForm productId={p.id} sizes={keys} colors={p.colors} stock={s} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-ash">
        <span className="flex items-center gap-1.5"><span className={cx("size-3 border border-rose-300 bg-rose-50")} /> Sold out</span>
        <span className="flex items-center gap-1.5"><span className="size-3 border border-amber-300 bg-amber-50" /> {LOW} or fewer</span>
        <span className="flex items-center gap-1.5"><span className="size-3 border border-black/10 bg-mist" /> Not tracked (∞)</span>
      </p>
    </>
  );
}
