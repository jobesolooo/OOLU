import Link from "next/link";
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

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin">) {
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

  const tiles = [
    { label: "Revenue (all time)", value: formatMoney(stats.revenue) },
    { label: "Last 30 days", value: formatMoney(stats.thirtyDay) },
    { label: "Paid orders", value: String(stats.count) },
    { label: "Waiting to ship", value: String(toFulfil.n) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white p-5">
            <p className="text-[10px] tracking-[0.14em] text-ash uppercase">{t.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin?filter=${f.key}`}
            className={cx(
              "border px-4 py-2 text-[10px] font-medium tracking-[0.14em] uppercase",
              f.key === filter.key ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:border-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] tracking-[0.14em] text-ash uppercase">
            <tr>
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-ash">No orders here.</td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-mist">
                <td className="p-4 font-semibold">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline">#{o.number}</Link>
                </td>
                <td className="p-4 text-ash">{formatDate(o.createdAt)}</td>
                <td className="p-4">{o.shippingAddress?.name ?? o.email ?? "—"}</td>
                <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                <td className="p-4 text-right tabular-nums">{formatMoney(o.total, o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
