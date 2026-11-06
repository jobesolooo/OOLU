"use client";

import Image from "next/image";
import { useActionState } from "react";
import { requestReturn, type ReturnState } from "@/app/returns/actions";
import { formatMoney } from "@/lib/format";
import { variantLabel } from "@/lib/variants";

export type ReturnableItem = {
  id: string;
  name: string;
  size: string | null;
  image: string | null;
  unitAmount: number;
  available: number;
};

const REASONS = ["Too small", "Too big", "Not as described", "Arrived damaged", "Wrong item sent", "Changed my mind", "Other"];

export function ReturnForm({
  orderId,
  currency,
  items,
  orderNumber,
  email,
  deadline,
}: {
  orderId: string;
  currency: string;
  items: ReturnableItem[];
  orderNumber?: number;
  email?: string;
  deadline: string;
}) {
  const [state, action, pending] = useActionState<ReturnState, FormData>(requestReturn, undefined);
  if (state?.ok) return <p className="bg-white p-6 text-[15px]">{state.ok}</p>;
  const any = items.some((i) => i.available > 0);
  if (!any) return <p className="text-sm text-ash">All items from this order are already in a return.</p>;

  return (
    <form action={action} className="space-y-5 bg-white p-6">
      <input type="hidden" name="orderId" value={orderId} />
      {orderNumber && <input type="hidden" name="orderNumber" value={orderNumber} />}
      {email && <input type="hidden" name="email" value={email} />}
      <p className="text-sm text-black/70">Choose what you&apos;re sending back. Return by {deadline}.</p>
      <ul className="divide-y divide-black/10">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-3">
            <div className="relative size-14 shrink-0 bg-stone">
              {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-ash">
                {i.size && i.size !== "One Size" ? `${variantLabel(i.size)} · ` : ""}
                {formatMoney(i.unitAmount, currency)}
              </p>
            </div>
            <select name={`qty:${i.id}`} defaultValue="0" disabled={i.available === 0} className="input w-20 py-2 text-sm" aria-label={`Quantity of ${i.name} to return`}>
              {Array.from({ length: i.available + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <label className="block">
        <span className="label mb-2 block font-semibold">Reason</span>
        <select name="reason" required defaultValue="" className="input">
          <option value="" disabled>
            Choose a reason
          </option>
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <textarea name="comment" rows={3} maxLength={1000} placeholder="Anything we should know? (optional)" className="input" />
      {state?.error && <p className="text-[13px] text-red-700">{state.error}</p>}
      <button className="btn-solid" disabled={pending}>{pending ? "Sending…" : "Request return"}</button>
    </form>
  );
}
