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
import { AdminHeader, Segmented } from "../ui";

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
      <AdminHeader
        eyebrow="People"
        title="Returns"
        description="Approve a request and the customer gets the return address by email. Mark it refunded to refund through Stripe."
        actions={<Segmented items={FILTERS.map((f) => ({ href: `/admin/returns?filter=${f.key}`, label: f.label, active: f.key === filter.key }))} />}
      />
      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="bg-white ring-1 ring-black/5">
            <AdminEmpty
              icon={RotateCcw}
              title={filter.key === "open" ? "No open returns" : "No closed returns"}
              body="Customers request returns from their account or the order tracking page. New requests appear here for approval."
            />
          </li>
        )}
        {rows.map(({ r, order }) => (
          <li key={r.id} className="grid grid-cols-[minmax(0,1fr)] gap-6 bg-white p-5 ring-1 ring-black/5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-xs text-ash">
                {formatDate(r.createdAt)} · <Link href={`/admin/orders/${order.id}`} className="underline">Order #{order.number}</Link> · {order.email}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase">{r.status}</span><span className="font-display text-[22px] tracking-[-0.01em]">{r.reason}</span></p>
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
