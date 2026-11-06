"use client";

import { useT, useTx } from "@/components/Prefs";

import Image from "next/image";
import { useActionState } from "react";
import { requestReturn, type ReturnState } from "@/app/returns/actions";
import { formatMoney } from "@/lib/format";
import { variantLabel } from "@/lib/variants";
import type { MessageKey } from "@/i18n/messages";

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
  const t = useT();
  const tx = useTx();
  const [state, action, pending] = useActionState<ReturnState, FormData>(requestReturn, undefined);
  if (state?.ok) return <p className="bg-white p-6 text-[15px]">{tx(state.ok)}</p>;
  const any = items.some((i) => i.available > 0);
  if (!any) return <p className="text-sm text-ash">{t("ret.allInReturn")}</p>;

  return (
    <form action={action} className="space-y-5 bg-white p-6">
      <input type="hidden" name="orderId" value={orderId} />
      {orderNumber && <input type="hidden" name="orderNumber" value={orderNumber} />}
      {email && <input type="hidden" name="email" value={email} />}
      <p className="text-sm text-black/70">{t("ret.choose", { date: deadline })}</p>
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
            <select name={`qty:${i.id}`} defaultValue="0" disabled={i.available === 0} className="input w-20 py-2 text-sm" aria-label={t("ret.qtyAria", { name: i.name })}>
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
        <span className="label mb-2 block font-semibold">{t("ret.reason")}</span>
        <select name="reason" required defaultValue="" className="input">
          <option value="" disabled>
            {t("ret.chooseReason")}
          </option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`ret.r.${r}` as MessageKey)}
            </option>
          ))}
        </select>
      </label>
      <textarea name="comment" rows={3} maxLength={1000} placeholder={t("ret.comment")} className="input" />
      {state?.error && <p className="text-[13px] text-red-700">{tx(state.error)}</p>}
      <button className="btn-solid" disabled={pending}>{pending ? t("common.sending") : t("ret.submit")}</button>
    </form>
  );
}
