"use client";

import { useMoney, useT } from "@/components/Prefs";

import type { OrderItem, ReturnRequest } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import type { MessageKey } from "@/i18n/messages";

export function ReturnList({ returns, items, currency }: { returns: ReturnRequest[]; items: OrderItem[]; currency: string }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const t = useT();
  const { date } = useMoney();
  return (
    <div className="bg-white p-6">
      <h2 className="label mb-4 font-semibold">{t("ret.title")}</h2>
      <ul className="space-y-4">
        {returns.map((r) => (
          <li key={r.id} className="border-l-2 border-ink pl-4 text-sm">
            <p className="font-semibold">{t(`ret.s.${r.status}`)}</p>
            <p className="mt-1 text-ash">
              {date(r.createdAt)} · {t(`ret.r.${r.reason}` as MessageKey) === `ret.r.${r.reason}` ? r.reason : t(`ret.r.${r.reason}` as MessageKey)} · {formatMoney(r.refundAmount, currency)}
            </p>
            <p className="mt-1">
              {r.items.map((l) => `${l.quantity}× ${byId.get(l.orderItemId)?.name ?? t("ret.item")}`).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
