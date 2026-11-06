import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { getReturnsForOrder, returnableQuantities, returnEligibility } from "@/lib/returns";
import { OrderDetail } from "@/components/OrderDetail";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReturnForm } from "@/components/orders/ReturnForm";
import { ReturnList } from "@/components/orders/ReturnList";
import { AccountShell } from "@/components/auth/AccountShell";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("order.meta"), robots: { index: false } };
}

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getOrder(id) : null;
  if (!data || data.order.userId !== user.id) notFound();
  const { order, items } = data;

  const [returns, qty] = await Promise.all([getReturnsForOrder(order.id), returnableQuantities(order, items)]);
  const eligible = returnEligibility(order);
  const { t, locale } = await getT();
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(d);

  return (
    <AccountShell user={user} active="orders">
    <div className="space-y-10">
      <div>
        <Link href="/account" className="text-[11px] tracking-[0.2em] text-ash uppercase hover:text-ink">{t("order.allOrders")}</Link>
        <h2 className="mt-3 font-display font-normal tracking-[-0.02em] text-4xl md:text-5xl">{t("order.title", { number: order.number })}</h2>
      </div>
      <OrderTimeline order={order} />
      <OrderDetail order={order} items={items} />
      {returns.length > 0 && <ReturnList returns={returns} items={items} currency={order.currency} />}
      {eligible.ok ? (
        <details>
          <summary className="btn-solid">{t("order.startReturn")}</summary>
          <div className="mt-4 max-w-2xl">
            <ReturnForm
              orderId={order.id}
              currency={order.currency}
              deadline={fmtDate(new Date(eligible.deadline))}
              items={items.map((i) => ({ ...i, available: qty.get(i.id) ?? 0 }))}
            />
          </div>
        </details>
      ) : (
        <p className="text-sm text-ash">{translateReason(eligible.reason, t)}</p>
      )}
    </div>
    </AccountShell>
  );
}

function translateReason(reason: string, t: (k: "msg.notReturnable" | "msg.windowClosed", v?: Record<string, string | number>) => string) {
  if (reason === "This order can't be returned.") return t("msg.notReturnable");
  const m = reason.match(/^The (\d+)-day return window has closed\.$/);
  return m ? t("msg.windowClosed", { days: m[1] }) : reason;
}
