import Link from "next/link";
import { EmptyRow } from "../Empty";
import { AdminHeader, Segmented, StatTile, table } from "../ui";
import { PackageOpen } from "lucide-react";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { cx, formatDate, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

const PAID: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded"];
const FILTERS = [
  { key: "open", label: "To fulfil", statuses: ["paid", "fulfilled"] as OrderStatus[] },
  { key: "all", label: "All paid", statuses: [...PAID, "refunded"] as OrderStatus[] },
  { key: "shipped", label: "Shipped", statuses: ["shipped", "delivered"] as OrderStatus[] },
  { key: "refunded", label: "Refunded", statuses: ["refunded", "partially_refunded"] as OrderStatus[] },
  { key: "abandoned", label: "Abandoned", statuses: ["pending", "cancelled"] as OrderStatus[] },
];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const raw = (await searchParams).filter;
  const filterKey = (Array.isArray(raw) ? raw[0] : raw) ?? "open";
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];

  const db = await getDb();
  const [stats] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}), 0)::int`,
      count: sql<number>`count(*)::int`,
      thirtyDay: sql<number>`coalesce(sum(case when ${schema.orders.paidAt} > now() - interval '30 days' then ${schema.orders.total} - ${schema.orders.refundedAmount} else 0 end), 0)::int`,
    })
    .from(schema.orders)
    .where(inArray(schema.orders.status, PAID));
  const [toFulfil] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(eq(schema.orders.status, "paid"));

  const orders = await db
    .select()
    .from(schema.orders)
    .where(inArray(schema.orders.status, filter.statuses.filter((s) => ORDER_STATUSES.includes(s))))
    .orderBy(desc(schema.orders.createdAt))
    .limit(200);

  return (
    <>
      <AdminHeader eyebrow="Store" title="Orders" description="Open an order to add tracking, mark it shipped or refund it. Customers get an email at each step." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile dark index={0} label="Waiting to ship" value={String(toFulfil.n)} sub="Paid, not yet packed" />
        <StatTile index={1} label="Last 30 days" value={formatMoney(stats.thirtyDay)} />
        <StatTile index={2} label="Revenue · all time" value={formatMoney(stats.revenue)} />
        <StatTile index={3} label="Paid orders" value={String(stats.count)} />
      </div>

      <div className="mt-10 mb-4">
        <Segmented
          items={FILTERS.map((f) => ({
            href: `/admin/orders?filter=${f.key}`,
            label: f.label,
            active: f.key === filter.key,
            count: f.key === "open" ? toFulfil.n : undefined,
          }))}
        />
      </div>

      <div className={table.wrap}>
        <table className={cx(table.table, "min-w-[640px]")}>
          <thead className={table.head}>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody className={table.body}>
            {orders.length === 0 && (
              <EmptyRow
                colSpan={5}
                icon={PackageOpen}
                title={filter.key === "open" ? "All caught up" : "No orders here"}
                body={
                  filter.key === "open"
                    ? "Paid orders that still need packing and shipping show up here. Nothing is waiting right now."
                    : "Orders matching this filter will show up here."
                }
                action={{ label: "View the store", href: "/" }}
              />
            )}
            {orders.map((o) => (
              <tr key={o.id} className="relative">
                <td className="font-semibold">
                  <Link href={`/admin/orders/${o.id}`} className="after:absolute after:inset-0 hover:underline">#{o.number}</Link>
                </td>
                <td className="text-ash">{formatDate(o.createdAt)}</td>
                <td>
                  <span className="block">{o.shippingAddress?.name ?? "—"}</span>
                  <span className="block text-[11px] text-ash">{o.email ?? ""}</span>
                </td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="text-right tabular-nums">{formatMoney(o.total, o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
