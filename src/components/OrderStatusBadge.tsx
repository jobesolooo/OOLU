"use client";

import { useT } from "@/components/Prefs";

import type { OrderStatus } from "@/lib/db/schema";
import { cx } from "@/lib/format";

const TONES: Record<OrderStatus, string> = {
  pending: "bg-black/5 text-black/60",
  paid: "bg-amber-100 text-amber-900",
  fulfilled: "bg-sky-100 text-sky-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-black/5 text-black/45",
  refunded: "bg-rose-100 text-rose-900",
  partially_refunded: "bg-rose-50 text-rose-900",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  return (
    <span className={cx("inline-block px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase", TONES[status])}>
      {t(`status.${status}`)}
    </span>
  );
}
