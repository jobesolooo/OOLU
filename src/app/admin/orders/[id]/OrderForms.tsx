"use client";

import { useActionState } from "react";
import type { Order } from "@/lib/db/schema";
import { refundOrder, updateOrder, type ActionResult } from "../../actions";

const STATUS_OPTIONS = [
  { value: "paid", label: "Paid — not packed" },
  { value: "fulfilled", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function Msg({ state }: { state: ActionResult }) {
  if (!state) return null;
  return <p className={`text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.ok}</p>;
}

export function FulfilmentForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(updateOrder, undefined);
  const options = STATUS_OPTIONS.some((o) => o.value === order.status)
    ? STATUS_OPTIONS
    : [{ value: order.status, label: order.status.replace("_", " ") }, ...STATUS_OPTIONS];
  return (
    <form action={action} className="space-y-4 bg-white p-6">
      <h2 className="label font-semibold">Fulfilment</h2>
      <input type="hidden" name="orderId" value={order.id} />
      <label className="block">
        <span className="mb-1 block text-xs text-ash">Status</span>
        <select name="status" defaultValue={order.status} className="input">
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-ash">Carrier</span>
          <input name="trackingCarrier" defaultValue={order.trackingCarrier ?? ""} placeholder="PostNL, DHL…" className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ash">Tracking number</span>
          <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-ash">Internal notes</span>
        <textarea name="notes" defaultValue={order.notes ?? ""} rows={3} className="input" />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="notify" defaultChecked /> Email the customer when marked shipped
      </label>
      <Msg state={state} />
      <button className="btn-solid w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function RefundForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(refundOrder, undefined);
  const remaining = order.total - order.refundedAmount;
  if (!order.stripePaymentIntentId || remaining <= 0) return null;
  return (
    <form
      action={action}
      className="space-y-4 bg-white p-6"
      onSubmit={(e) => {
        if (!confirm("Issue this refund? This can't be undone.")) e.preventDefault();
      }}
    >
      <h2 className="label font-semibold">Refund</h2>
      <input type="hidden" name="orderId" value={order.id} />
      <label className="block">
        <span className="mb-1 block text-xs text-ash">Amount ({order.currency.toUpperCase()}) — leave blank for the full {(remaining / 100).toFixed(2)}</span>
        <input name="amount" inputMode="decimal" placeholder={(remaining / 100).toFixed(2)} className="input" />
      </label>
      <Msg state={state} />
      <button className="w-full border border-rose-800 px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-rose-800 uppercase hover:bg-rose-800 hover:text-white disabled:opacity-40" disabled={pending}>
        {pending ? "Refunding…" : "Issue refund"}
      </button>
    </form>
  );
}
