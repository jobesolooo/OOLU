import type Stripe from "stripe";
import { EmptyRow } from "../Empty";
import { TicketPercent } from "lucide-react";
import { isStripeConfigured } from "@/lib/stripe";
import { listPromotions } from "@/lib/promotions";
import { formatDate, formatMoney } from "@/lib/format";
import { createDiscount, toggleDiscount } from "../actions";
import { AdminForm } from "../FormMessage";

function describe(p: Stripe.PromotionCode) {
  const c = p.promotion?.coupon;
  if (!c || typeof c === "string") return "—";
  return c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `${formatMoney(c.amount_off, c.currency ?? undefined)} off` : "—";
}

export default async function DiscountsPage() {
  if (!isStripeConfigured()) {
    return <p className="bg-white p-6 text-sm">Discount codes live in Stripe. Connect Stripe to create and manage them.</p>;
  }
  const promos = await listPromotions();
  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="h-fit bg-white p-6">
        <h1 className="font-display font-normal tracking-[-0.02em] text-2xl">New discount code</h1>
        <p className="mt-2 text-xs text-ash">Customers enter these in the promo code box at checkout.</p>
        <AdminForm action={createDiscount} submitLabel="Create code" className="mt-6 space-y-3">
          <input name="code" required placeholder="CODE e.g. FAMILY20" className="input font-mono uppercase" />
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <select name="kind" className="input">
              <option value="percent">% off</option>
              <option value="amount">$ off</option>
            </select>
            <input name="value" required inputMode="decimal" placeholder="20" className="input" />
          </div>
          <input name="maxRedemptions" inputMode="numeric" placeholder="Max uses (blank = unlimited)" className="input" />
          <input name="minimumAmount" inputMode="decimal" placeholder="Minimum order $ (optional)" className="input" />
          <label className="block text-xs text-ash">
            Expires (optional)
            <input name="expiresAt" type="date" className="input mt-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="firstOrderOnly" /> First order only
          </label>
        </AdminForm>
      </div>

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] tracking-[0.14em] text-ash uppercase">
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Discount</th>
              <th className="p-4 font-medium">Used</th>
              <th className="p-4 font-medium">Expires</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {promos.length === 0 && (
              <EmptyRow colSpan={6} icon={TicketPercent} title="No discount codes yet" body="Create one with the form — customers enter it in the promo code box at checkout." />
            )}
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-mono font-semibold">{p.code}</td>
                <td className="p-4">{describe(p)}</td>
                <td className="p-4 tabular-nums">{p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}</td>
                <td className="p-4 text-ash">{p.expires_at ? formatDate(new Date(p.expires_at * 1000)) : "—"}</td>
                <td className="p-4">{p.active ? "Active" : <span className="text-ash">Off</span>}</td>
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
  );
}
