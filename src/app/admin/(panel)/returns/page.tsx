import Link from "next/link";
import { AdminEmpty } from "../Empty";
import { RotateCcw } from "lucide-react";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { listReturns } from "@/lib/returns";
import type { ReturnStatus } from "@/lib/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { updateReturn } from "../actions";
import { AdminForm } from "../FormMessage";

const FILTERS: { key: string; label: string; statuses: ReturnStatus[] }[] = [
  { key: "open", label: "Open", statuses: ["requested", "approved", "received"] },
  { key: "done", label: "Closed", statuses: ["refunded", "rejected"] },
];

const NEXT: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["received", "refunded", "rejected"],
  received: ["refunded", "rejected"],
  refunded: [],
  rejected: ["approved"],
};

export default async function ReturnsAdmin({ searchParams }: PageProps<"/admin/returns">) {
  const raw = (await searchParams).filter;
  const filter = FILTERS.find((f) => f.key === raw) ?? FILTERS[0];
  const rows = await listReturns(filter.statuses);
  const db = await getDb();
  const itemIds = rows.flatMap((r) => r.r.items.map((l) => l.orderItemId));
  const items = itemIds.length ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.id, itemIds)) : [];
  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-normal tracking-[-0.02em] text-3xl">Returns</h1>
          <p className="mt-1 text-xs text-ash">Approve → customer gets the return address by email. Mark refunded to refund via Stripe.</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <a key={f.key} href={`/admin/returns?filter=${f.key}`} className={`border px-4 py-2 text-[11px] tracking-[0.12em] uppercase ${f.key === filter.key ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}>
              {f.label}
            </a>
          ))}
        </div>
      </div>
      <ul className="space-y-4">
        {rows.length === 0 && (
          <li className="bg-white">
            <AdminEmpty
              icon={RotateCcw}
              title={filter.key === "open" ? "No open returns" : "No closed returns"}
              body="Customers request returns from their account or the order tracking page. New requests appear here for approval."
            />
          </li>
        )}
        {rows.map(({ r, order }) => (
          <li key={r.id} className="grid gap-6 bg-white p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs text-ash">
                {formatDate(r.createdAt)} · <Link href={`/admin/orders/${order.id}`} className="underline">Order #{order.number}</Link> · {order.email}
              </p>
              <p className="mt-2 font-semibold capitalize">{r.status} · {r.reason}</p>
              <ul className="mt-2 text-sm">
                {r.items.map((l) => {
                  const i = byId.get(l.orderItemId);
                  return (
                    <li key={l.orderItemId}>
                      {l.quantity}× {i?.name ?? "Item"}{i?.size && i.size !== "One Size" ? ` (${i.size})` : ""}
                    </li>
                  );
                })}
              </ul>
              {r.comment && <p className="mt-3 border-l-2 border-black/20 pl-3 text-sm text-black/70">“{r.comment}”</p>}
              <p className="mt-3 text-sm">Refund value: <strong>{formatMoney(r.refundAmount, order.currency)}</strong></p>
            </div>
            {NEXT[r.status].length > 0 && (
              <AdminForm action={updateReturn} submitLabel="Update" className="space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={NEXT[r.status][0]} className="input">
                  {NEXT[r.status].map((s) => (
                    <option key={s} value={s}>Mark {s}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="refund" defaultChecked /> When marking refunded, refund {formatMoney(r.refundAmount, order.currency)} via Stripe
                </label>
                <textarea name="note" rows={2} placeholder="Note to the customer (optional)" className="input" />
              </AdminForm>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
