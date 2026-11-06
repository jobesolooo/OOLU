import type { OrderItem, ReturnRequest } from "@/lib/db/schema";
import { formatDate, formatMoney } from "@/lib/format";

const LABEL: Record<ReturnRequest["status"], string> = {
  requested: "Requested — under review",
  approved: "Approved — send it back",
  received: "Received — refund coming",
  refunded: "Refunded",
  rejected: "Not accepted",
};

export function ReturnList({ returns, items, currency }: { returns: ReturnRequest[]; items: OrderItem[]; currency: string }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return (
    <div className="bg-white p-6">
      <h2 className="label mb-4 font-semibold">Returns</h2>
      <ul className="space-y-4">
        {returns.map((r) => (
          <li key={r.id} className="border-l-2 border-ink pl-4 text-sm">
            <p className="font-semibold">{LABEL[r.status]}</p>
            <p className="mt-1 text-ash">
              {formatDate(r.createdAt)} · {r.reason} · {formatMoney(r.refundAmount, currency)}
            </p>
            <p className="mt-1">
              {r.items.map((l) => `${l.quantity}× ${byId.get(l.orderItemId)?.name ?? "Item"}`).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
