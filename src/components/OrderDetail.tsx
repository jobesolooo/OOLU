import Image from "next/image";
import type { Order, OrderItem } from "@/lib/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { variantLabel } from "@/lib/variants";

export function OrderDetail({ order, items }: { order: Order; items: OrderItem[] }) {
  const a = order.shippingAddress;
  return (
    <div className="grid gap-8 md:grid-cols-[1.6fr_1fr]">
      <div className="bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="label font-semibold">Items</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <ul className="divide-y divide-black/10">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="relative size-16 shrink-0 bg-stone">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-ash">
                  {i.size && i.size !== "One Size" ? `${variantLabel(i.size)} · ` : ""}Qty {i.quantity} × {formatMoney(i.unitAmount, order.currency)}
                </p>
              </div>
              <p className="text-sm">{formatMoney(i.unitAmount * i.quantity, order.currency)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-ash">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd>{formatMoney(order.shipping, order.currency)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-ash">Tax</dt><dd>{formatMoney(order.tax, order.currency)}</dd></div>}
          <div className="flex justify-between border-t border-black/10 pt-2 font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
          {order.refundedAmount > 0 && (
            <div className="flex justify-between text-rose-800"><dt>Refunded</dt><dd>−{formatMoney(order.refundedAmount, order.currency)}</dd></div>
          )}
        </dl>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-6 text-sm">
          <h2 className="label mb-3 font-semibold">Details</h2>
          <p className="text-ash">Placed {formatDate(order.createdAt)}</p>
          {order.email && <p className="mt-1">{order.email}</p>}
          {order.trackingNumber && (
            <p className="mt-3">
              Tracking: <strong>{order.trackingCarrier} {order.trackingNumber}</strong>
            </p>
          )}
        </div>
        {a && (
          <div className="bg-white p-6 text-sm leading-relaxed">
            <h2 className="label mb-3 font-semibold">Shipping address</h2>
            {[a.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country, a.phone]
              .filter(Boolean)
              .map((l, i) => (
                <p key={i}>{l}</p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
