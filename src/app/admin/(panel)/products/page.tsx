import Image from "next/image";
import Link from "next/link";
import { Plus, Shirt } from "lucide-react";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { demoProducts, isOnSale, isUpcoming } from "@/lib/catalog";
import { listAdminProducts, type AdminProduct } from "@/lib/stripe-products";
import { getStockMap, stockKey } from "@/lib/inventory";
import { allVariantKeys } from "@/lib/variants";
import { cx, formatMoney } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { AdminEmpty } from "../Empty";
import { StripeSetup } from "../StripeSetup";
import { AdminHeader, Segmented, ghostBtn } from "../ui";
import { ImportButton } from "./ImportButton";

function Badge({ children, tone = "grey" }: { children: React.ReactNode; tone?: "grey" | "lav" | "rose" | "dark" }) {
  const tones = { grey: "bg-white/90 text-ink", lav: "bg-accent text-ink", rose: "bg-rose-50 text-rose-700", dark: "bg-ink text-white" };
  return <span className={cx("px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] uppercase", tones[tone])}>{children}</span>;
}

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const view = sp.view === "archived" ? "archived" : "live";
  const stripe = isStripeConfigured();
  const now = nowMs();

  let products: AdminProduct[] = [];
  let loadError: string | null = null;
  if (stripe) {
    try {
      products = await listAdminProducts();
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Couldn't reach Stripe";
    }
  }
  const demo = demoProducts();
  const live = products.filter((p) => p.active);
  const archived = products.filter((p) => !p.active);
  const shown = view === "archived" ? archived : live;
  const stock = await getStockMap();
  const stockSummary = (p: AdminProduct) => {
    const keys = allVariantKeys(p);
    const tracked = keys.map((k) => stock.get(stockKey(p.id, k))).filter((v): v is number => v !== undefined);
    if (!tracked.length) return "Stock not tracked";
    const out = tracked.filter((v) => v === 0).length;
    return `${tracked.reduce((a, b) => a + b, 0)} in stock${out ? ` · ${out} sold out` : ""}`;
  };

  return (
    <>
      <AdminHeader
        eyebrow="Catalogue"
        title="Products"
        description="Everything here is saved straight to Stripe. Edits made in the Stripe dashboard show up here too."
        actions={
          stripe && (
            <>
              <a href={stripeDashboardUrl("/products")} target="_blank" rel="noreferrer" className={ghostBtn}>
                Stripe ↗
              </a>
              <Link href="/admin/products/new" className="btn-solid gap-2">
                <Plus className="size-4" strokeWidth={1.5} /> New product
              </Link>
            </>
          )
        }
      />

      {!stripe ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <StripeSetup />
          <section className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <h2 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Showing the built-in catalogue</h2>
            <p className="mb-4 text-[12px] text-ash">Until Stripe is connected the store shows these {demo.length} products. They can be copied into Stripe in one click afterwards.</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {demo.slice(0, 12).map((p) => (
                <li key={p.id} className="relative aspect-[4/5] overflow-hidden bg-stone">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill sizes="120px" className="object-cover" />}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : loadError ? (
        <p className="bg-rose-50 p-5 text-[13px] text-rose-800 ring-1 ring-rose-200">Couldn&apos;t load products from Stripe: {loadError}</p>
      ) : (
        <>
          {live.length === 0 && (
            <section className="mb-6 flex flex-col items-start gap-4 bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">Stripe is connected</p>
                <p className="mt-2 font-display text-[28px] leading-tight tracking-[-0.02em]">Move the {demo.length} products into Stripe</p>
                <p className="mt-1 text-[13px] text-white/60">Photos, prices, sizes, colours and details are copied. Takes about a minute.</p>
              </div>
              <ImportButton count={demo.length} />
            </section>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              items={[
                { href: "/admin/products", label: "Live", active: view === "live", count: live.length },
                { href: "/admin/products?view=archived", label: "Archived", active: view === "archived", count: archived.length },
              ]}
            />
            {(sp.archived || sp.deleted) && (
              <p className="text-[12px] text-emerald-700">{sp.deleted ? "Product deleted from Stripe." : "Product had sales, so it was archived instead of deleted."}</p>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="bg-white ring-1 ring-black/5">
              <AdminEmpty
                icon={Shirt}
                title={view === "archived" ? "Nothing archived" : "No live products"}
                body={view === "archived" ? "Products you take off the store stay here, so you can bring them back." : "Create one, or copy the built-in catalogue into Stripe."}
                action={{ label: "New product", href: "/admin/products/new" }}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {shown.map((p, i) => (
                <li key={p.id} className="rise" style={{ "--delay": `${Math.min(i, 12) * 30}ms` } as React.CSSProperties}>
                  <Link href={`/admin/products/${p.id}`} className="group block bg-white ring-1 ring-black/5 transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                      {p.images[0] ? (
                        <Image src={p.images[0]} alt={p.name} fill sizes="(min-width:1280px) 20vw, 45vw" className={cx("object-cover transition duration-500 group-hover:scale-[1.03]", !p.active && "grayscale")} />
                      ) : (
                        <span className="grid size-full place-items-center text-[11px] text-ash">No photo</span>
                      )}
                      <span className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {!p.hasPrice && <Badge tone="rose">No price</Badge>}
                        {isUpcoming(p, now) && <Badge tone="dark">Drop</Badge>}
                        {isOnSale(p) && <Badge tone="lav">Sale</Badge>}
                        {p.featured && <Badge>Featured</Badge>}
                      </span>
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-[10px] tracking-[0.1em] text-ash uppercase">{p.category.replace(/-/g, " ")}</p>
                      <p className="mt-0.5 line-clamp-2 min-h-[2.6em] text-[12px] leading-snug uppercase">{p.name}</p>
                      <p className="mt-1 text-[13px] tabular-nums">
                        {formatMoney(p.unitAmount, p.currency)}
                        {isOnSale(p) && <s className="ml-2 text-[12px] text-ash">{formatMoney(p.compareAtAmount!, p.currency)}</s>}
                      </p>
                      <p className="mt-1 text-[11px] text-ash">{stockSummary(p)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {live.length > 0 && (
            <div className="mt-10 border-t border-black/10 pt-6">
              <p className="mb-3 text-[12px] text-ash">Still have products in the built-in catalogue that aren&apos;t in Stripe yet? Copying skips ones already there.</p>
              <ImportButton count={demo.length} />
            </div>
          )}
        </>
      )}
    </>
  );
}
