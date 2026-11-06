import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { getReturnsForOrder, returnableQuantities, returnEligibility } from "@/lib/returns";
import { formatDate } from "@/lib/format";
import { OrderDetail } from "@/components/OrderDetail";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReturnForm } from "@/components/orders/ReturnForm";
import { ReturnList } from "@/components/orders/ReturnList";
import { AccountShell } from "@/components/auth/AccountShell";

export const metadata: Metadata = { title: "Order" };

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getOrder(id) : null;
  if (!data || data.order.userId !== user.id) notFound();
  const { order, items } = data;

  const [returns, qty] = await Promise.all([getReturnsForOrder(order.id), returnableQuantities(order, items)]);
  const eligible = returnEligibility(order);

  return (
    <AccountShell user={user} active="orders">
    <div className="space-y-10">
      <div>
        <Link href="/account" className="text-[11px] tracking-[0.2em] text-ash uppercase hover:text-ink">← All orders</Link>
        <h2 className="mt-3 font-display font-normal tracking-[-0.02em] text-4xl md:text-5xl">Order #{order.number}</h2>
      </div>
      <OrderTimeline order={order} />
      <OrderDetail order={order} items={items} />
      {returns.length > 0 && <ReturnList returns={returns} items={items} currency={order.currency} />}
      {eligible.ok ? (
        <details>
          <summary className="btn-solid">Start a return</summary>
          <div className="mt-4 max-w-2xl">
            <ReturnForm
              orderId={order.id}
              currency={order.currency}
              deadline={formatDate(new Date(eligible.deadline))}
              items={items.map((i) => ({ ...i, available: qty.get(i.id) ?? 0 }))}
            />
          </div>
        </details>
      ) : (
        <p className="text-sm text-ash">{eligible.reason}</p>
      )}
    </div>
    </AccountShell>
  );
}
