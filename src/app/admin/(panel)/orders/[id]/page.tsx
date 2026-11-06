import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { stripeDashboardUrl } from "@/lib/stripe";
import { OrderDetail } from "@/components/OrderDetail";
import { FulfilmentForm, RefundForm } from "./OrderForms";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getOrder(id) : null;
  if (!data) notFound();
  const { order, items } = data;

  return (
    <>
      <Link href="/admin" className="text-[10px] tracking-[0.2em] text-ash uppercase hover:text-ink">← Orders</Link>
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-[900] uppercase">Order #{order.number}</h1>
        {order.stripePaymentIntentId && (
          <a href={stripeDashboardUrl(`/payments/${order.stripePaymentIntentId}`)} target="_blank" rel="noreferrer" className="text-xs underline">
            View payment in Stripe ↗
          </a>
        )}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <OrderDetail order={order} items={items} />
        <div className="space-y-6">
          <FulfilmentForm order={order} />
          <RefundForm order={order} />
        </div>
      </div>
    </>
  );
}
