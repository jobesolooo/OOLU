"use client";

import Image from "next/image";
import { useActionState } from "react";
import { trackOrder, type TrackResult } from "./actions";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReturnForm } from "@/components/orders/ReturnForm";
import { ReturnList } from "@/components/orders/ReturnList";
import { variantLabel } from "@/lib/variants";

export function TrackView() {
  const [state, action, pending] = useActionState<TrackResult, FormData>(trackOrder, undefined);
  const found = state && "order" in state ? state : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
      <form action={action} className="h-fit space-y-4">
        <label className="block">
          <span className="label mb-2 block">Order number</span>
          <input name="number" required inputMode="numeric" placeholder="1001" className="input" />
        </label>
        <label className="block">
          <span className="label mb-2 block">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        {state?.error && <p className="text-[13px] text-red-700" role="alert">{state.error}</p>}
        <button className="btn-solid w-full" disabled={pending}>{pending ? "Looking…" : "Track order"}</button>
        <p className="text-xs text-ash">Your order number is in your confirmation email.</p>
      </form>

      {found && (
        <div className="space-y-8">
          <div>
            <p className="eyebrow text-ash">Order #{found.order.number}</p>
            <p className="mt-2 text-sm text-ash">Placed {formatDate(found.order.createdAt)}</p>
          </div>
          <OrderTimeline order={found.order} />
          <ul className="divide-y divide-black/10 bg-white px-6">
            {found.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative size-14 shrink-0 bg-stone">{i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}</div>
                <p className="flex-1 text-sm">
                  {i.name}
                  <span className="block text-xs text-ash">
                    {i.size && i.size !== "One Size" ? `${variantLabel(i.size)} · ` : ""}Qty {i.quantity}
                  </span>
                </p>
                <p className="text-sm">{formatMoney(i.unitAmount * i.quantity, found.order.currency)}</p>
              </li>
            ))}
          </ul>
          {found.returns.length > 0 && <ReturnList returns={found.returns} items={found.items} currency={found.order.currency} />}
          {found.returnDeadline && (
            <details>
              <summary className="btn-solid">Start a return</summary>
              <div className="mt-4">
                <ReturnForm
                  orderId={found.order.id}
                  orderNumber={found.order.number}
                  email={found.email}
                  currency={found.order.currency}
                  deadline={formatDate(found.returnDeadline)}
                  items={found.items.map((i) => ({ ...i, available: found.returnable[i.id] ?? 0 }))}
                />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
