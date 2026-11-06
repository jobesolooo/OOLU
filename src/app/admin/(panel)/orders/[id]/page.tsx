import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { stripeDashboardUrl } from "@/lib/stripe";
import { OrderDetail } from "@/components/OrderDetail";
import { FulfilmentForm, RefundForm } from "./OrderForms";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatDate } from "@/lib/format";
import { AdminHeader, ghostBtn } from "../../ui";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getOrder(id) : null;
  if (!data) notFound();
  const { order, items } = data;

  return (
    <>
      <Link href="/admin/orders" className="group mb-4 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-ash uppercase hover:text-ink">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Orders
      </Link>
      <AdminHeader
        eyebrow={`Placed ${formatDate(order.createdAt)}`}
        title={`Order #${order.number}`}
        description={<OrderStatusBadge status={order.status} />}
        actions={
          order.stripePaymentIntentId && (
            <a href={stripeDashboardUrl(`/payments/${order.stripePaymentIntentId}`)} target="_blank" rel="noreferrer" className={ghostBtn}>
              Payment in Stripe ↗
            </a>
          )
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-white p-5 ring-1 ring-black/5 sm:p-8">
          <OrderDetail order={order} items={items} />
        </div>
        <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <FulfilmentForm order={order} />
          <RefundForm order={order} />
        </div>
      </div>
    </>
  );
}
