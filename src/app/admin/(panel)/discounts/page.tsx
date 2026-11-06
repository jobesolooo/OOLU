import Link from "next/link";
import type Stripe from "stripe";
import { TicketPercent } from "lucide-react";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { listPromotions } from "@/lib/promotions";
import { cx, formatDate, formatMoney } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { createDiscount, removeDiscount, toggleDiscount } from "../actions";
import { AdminForm } from "../FormMessage";
import { EmptyRow } from "../Empty";
import { StripeSetup } from "../StripeSetup";
import { AdminHeader, Segmented, ghostBtn, table } from "../ui";

const couponOf = (p: Stripe.PromotionCode) => {
  const c = p.promotion?.coupon;
  return c && typeof c !== "string" ? c : null;
};

function describe(p: Stripe.PromotionCode) {
  const c = couponOf(p);
  if (!c) return "—";
  return c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `${formatMoney(c.amount_off, c.currency ?? undefined)} off` : "—";
}

function rules(p: Stripe.PromotionCode) {
  const r = p.restrictions;
  return [
    r.first_time_transaction && "First order only",
    r.minimum_amount && `Min. ${formatMoney(r.minimum_amount, r.minimum_amount_currency ?? undefined)}`,
    p.metadata?.source === "admin" ? null : "Made in Stripe",
  ].filter(Boolean) as string[];
}

const expired = (p: Stripe.PromotionCode) => p.expires_at != null && p.expires_at * 1000 < nowMs();

export default async function DiscountsPage({ searchParams }: PageProps<"/admin/discounts">) {
  if (!isStripeConfigured()) {
    return (
      <>
        <AdminHeader eyebrow="Catalogue" title="Discounts" description="Discount codes live in Stripe. Connect Stripe to create and manage them here." />
        <div className="max-w-3xl">
          <StripeSetup compact />
        </div>
      </>
    );
  }
  const sp = await searchParams;
  const view = sp.view === "paused" ? "paused" : "active";
  const all = await listPromotions();
  const active = all.filter((p) => p.active && !expired(p));
  const paused = all.filter((p) => !p.active || expired(p)).filter((p) => !p.metadata?.replaced_by);
  const shown = view === "paused" ? paused : active;
  const editing = typeof sp.edit === "string" ? all.find((p) => p.id === sp.edit) : undefined;
  const ec = editing ? couponOf(editing) : null;

  return (
    <>
      <AdminHeader
        eyebrow="Catalogue"
        title="Discounts"
        description="Codes shoppers type at checkout. They're saved in Stripe, and codes you make in the Stripe dashboard show up here too."
        actions={
          <a href={stripeDashboardUrl("/coupons")} target="_blank" rel="noreferrer" className={ghostBtn}>
            Stripe ↗
          </a>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="h-fit bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">{editing ? `Edit ${editing.code}` : "New discount code"}</h2>
            {editing && (
              <Link href="/admin/discounts" className="text-[11px] text-ash underline">
                Cancel
              </Link>
            )}
          </div>
          {editing && <p className="mt-2 text-[12px] text-ash">Stripe can&apos;t change a code once made, so saving pauses this one and creates a fresh code with the same name. Uses so far still count.</p>}
          <AdminForm key={editing?.id ?? "new"} action={createDiscount} submitLabel={editing ? "Save changes" : "Create code"} className="mt-5 space-y-3">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <input name="code" required defaultValue={editing?.code} placeholder="CODE e.g. FAMILY20" className="input font-mono uppercase" />
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <select name="kind" defaultValue={ec?.amount_off ? "amount" : "percent"} className="input">
                <option value="percent">% off</option>
                <option value="amount">€ off</option>
              </select>
              <input name="value" required inputMode="decimal" defaultValue={ec ? (ec.percent_off ?? (ec.amount_off ?? 0) / 100) : undefined} placeholder="20" className="input" />
            </div>
            <input name="maxRedemptions" inputMode="numeric" defaultValue={editing?.max_redemptions ?? undefined} placeholder="Max uses (blank = unlimited)" className="input" />
            <input
              name="minimumAmount"
              inputMode="decimal"
              defaultValue={editing?.restrictions.minimum_amount ? editing.restrictions.minimum_amount / 100 : undefined}
              placeholder="Minimum order € (optional)"
              className="input"
            />
            <label className="block text-xs text-ash">
              Expires (optional)
              <input name="expiresAt" type="date" defaultValue={editing?.expires_at ? new Date(editing.expires_at * 1000).toISOString().slice(0, 10) : undefined} className="input mt-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="firstOrderOnly" defaultChecked={editing?.restrictions.first_time_transaction} className="size-[18px] accent-ink" /> First order only
            </label>
          </AdminForm>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              items={[
                { href: "/admin/discounts", label: "Active", active: view === "active", count: active.length },
                { href: "/admin/discounts?view=paused", label: "Paused & expired", active: view === "paused", count: paused.length },
              ]}
            />
            {typeof sp.saved === "string" && <p className="text-[12px] text-emerald-700">{sp.saved} updated in Stripe</p>}
          </div>
          <div className={table.wrap}>
            <table className={cx(table.table, "min-w-[720px]")}>
              <thead className={table.head}>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Expires</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {shown.length === 0 && (
                  <EmptyRow
                    colSpan={5}
                    icon={TicketPercent}
                    title={view === "active" ? "No active codes" : "Nothing paused"}
                    body={view === "active" ? "Create one with the form. It works at checkout straight away." : "Paused and expired codes show here so you can switch them back on."}
                  />
                )}
                {shown.map((p) => (
                  <tr key={p.id} className={cx(editing?.id === p.id && "bg-accent/10")}>
                    <td>
                      <span className="font-mono font-semibold">{p.code}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {rules(p).map((r) => (
                          <span key={r} className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-black/60">
                            {r}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td>{describe(p)}</td>
                    <td className="tabular-nums">
                      {p.times_redeemed}
                      {p.max_redemptions ? ` / ${p.max_redemptions}` : ""}
                    </td>
                    <td className="text-ash">{p.expires_at ? <span className={cx(expired(p) && "text-rose-700")}>{formatDate(new Date(p.expires_at * 1000))}</span> : "—"}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {p.active && (
                          <Link href={`/admin/discounts?edit=${p.id}`} className="border border-black/15 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase hover:border-ink">
                            Edit
                          </Link>
                        )}
                        {!expired(p) && (
                          <form action={toggleDiscount}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="active" value={String(!p.active)} />
                            <button className="border border-black/15 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase hover:border-ink">{p.active ? "Pause" : "Resume"}</button>
                          </form>
                        )}
                        <form action={removeDiscount}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="border border-rose-200 px-3 py-1.5 text-[10px] tracking-[0.1em] text-rose-700 uppercase hover:bg-rose-50">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-ash">Personal newsletter welcome codes are created automatically and hidden here.</p>
        </div>
      </div>
    </>
  );
}
