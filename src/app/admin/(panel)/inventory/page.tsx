import Image from "next/image";
import { getProducts } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";
import { refreshCatalog } from "../actions";
import { StockForm } from "./StockForm";
import { allVariantKeys } from "@/lib/variants";
import { AdminHeader, ghostBtn } from "../ui";

export default async function InventoryPage() {
  const products = await getProducts();
  const stock = await getStockMap();
  const stripe = isStripeConfigured();

  return (
    <>
      <AdminHeader
        eyebrow="Catalogue"
        title="Products & stock"
        description="Names, prices, photos and descriptions live in Stripe. Set stock per size here: leave a box empty (∞) to not track that size. Stock drops automatically when an order is paid."
        actions={
          <>
            <form action={refreshCatalog}>
              <button className={ghostBtn}>Refresh from Stripe</button>
            </form>
            {stripe && (
              <a href={stripeDashboardUrl("/products?active=true")} target="_blank" rel="noreferrer" className="btn-solid">
                Add / edit in Stripe ↗
              </a>
            )}
          </>
        }
      />

      <ul className="divide-y divide-black/5 bg-white ring-1 ring-black/5">
        {products.map((p) => {
          const s: Record<string, number> = {};
          const keys = allVariantKeys(p);
          for (const size of keys) {
            const v = stock.get(stockKey(p.id, size));
            if (v !== undefined) s[size] = v;
          }
          return (
            <li key={p.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-mist/60 sm:px-6 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden bg-stone">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.name}
                    {p.isDemo && <span className="ml-2 bg-black/5 px-1.5 py-0.5 text-[9px] tracking-wider uppercase">demo</span>}
                  </p>
                  <p className="text-xs text-ash">
                    {formatMoney(p.unitAmount, p.currency)} · {p.category}
                    {p.collection && ` · ${p.collection}`}
                    {p.featured && " · featured"}
                  </p>
                </div>
              </div>
              <StockForm productId={p.id} sizes={keys} stock={s} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
