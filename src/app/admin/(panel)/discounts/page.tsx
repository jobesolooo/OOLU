import type Stripe from "stripe";
import { EmptyRow } from "../Empty";
import { TicketPercent } from "lucide-react";
import { isStripeConfigured } from "@/lib/stripe";
import { listPromotions } from "@/lib/promotions";
import { formatDate, formatMoney } from "@/lib/format";
import { createDiscount, toggleDiscount } from "../actions";
import { AdminForm } from "../FormMessage";
import { AdminHeader, table } from "../ui";
import { cx } from "@/lib/format";

function describe(p: Stripe.PromotionCode) {
  const c = p.promotion?.coupon;
  if (!c || typeof c === "string") return "—";
  return c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `${formatMoney(c.amount_off, c.currency ?? undefined)} off` : "—";
}

export default async function DiscountsPage() {
  if (!isStripeConfigured()) {
    return (
      <>
        <AdminHeader eyebrow="Catalogue" title="Discounts" />
        <p className="bg-white p-6 text-sm ring-1 ring-black/5">Discount codes live in Stripe. Connect Stripe to create and manage them.</p>
      </>
    );
  }
  const promos = await listPromotions();
  return (
    <>
    <AdminHeader eyebrow="Catalogue" title="Discounts" description="Codes customers type into the promo box at checkout. They're stored in Stripe." />
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="h-fit bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-6">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">New discount code</h2>
        <AdminForm action={createDiscount} submitLabel="Create code" className="mt-6 space-y-3">
          <input name="code" required placeholder="CODE e.g. FAMILY20" className="input font-mono uppercase" />
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <select name="kind" className="input">
              <option value="percent">% off</option>
              <option value="amount">€ off</option>
            </select>
            <input name="value" required inputMode="decimal" placeholder="20" className="input" />
          </div>
          <input name="maxRedemptions" inputMode="numeric" placeholder="Max uses (blank = unlimited)" className="input" />
          <input name="minimumAmount" inputMode="decimal" placeholder="Minimum order € (optional)" className="input" />
          <label className="block text-xs text-ash">
            Expires (optional)
            <input name="expiresAt" type="date" className="input mt-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="firstOrderOnly" /> First order only
          </label>
        </AdminForm>
      </div>

      <div className={table.wrap}>
        <table className={cx(table.table, "min-w-[640px]")}>
          <thead className={table.head}>
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Discount</th>
              <th className="p-4 font-medium">Used</th>
              <th className="p-4 font-medium">Expires</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className={table.body}>
            {promos.length === 0 && (
              <EmptyRow colSpan={6} icon={TicketPercent} title="No discount codes yet" body="Create one with the form — customers enter it in the promo code box at checkout." />
            )}
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-mono font-semibold">{p.code}</td>
                <td className="p-4">{describe(p)}</td>
                <td className="p-4 tabular-nums">{p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}</td>
                <td className="p-4 text-ash">{p.expires_at ? formatDate(new Date(p.expires_at * 1000)) : "—"}</td>
                <td className="p-4">{p.active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">Active</span> : <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] text-ash">Off</span>}</td>
                <td className="p-4 text-right">
                  <form action={toggleDiscount}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                    <button className="text-xs underline">{p.active ? "Deactivate" : "Activate"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="p-4 text-xs text-ash">Personal newsletter welcome codes are created automatically and hidden here.</p>
      </div>
    </div>
    </>
  );
}
