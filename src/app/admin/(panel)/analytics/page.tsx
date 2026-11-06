import { and, desc, gte, inArray, sql } from "drizzle-orm";
import { AdminEmpty } from "../Empty";
import { BarChart3 } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/schema";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { nowMs } from "@/lib/time";

const PAID: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded", "refunded"];

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const raw = (await searchParams).days;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const now = nowMs();
  const since = new Date(now - days * 86_400_000);
  const prevSince = new Date(now - 2 * days * 86_400_000);
  const db = await getDb();

  const net = sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}), 0)::int`;
  const n = sql<number>`count(*)::int`;
  const paidWhere = (from: Date, to?: Date) =>
    and(
      inArray(schema.orders.status, PAID),
      gte(schema.orders.paidAt, from),
      to ? sql`${schema.orders.paidAt} < ${to.toISOString()}` : undefined,
    );

  const [[cur], [prev], daily, top, [abandon], [subs], [refunds]] = await Promise.all([
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidWhere(since)),
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidWhere(prevSince, since)),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${schema.orders.paidAt}), 'YYYY-MM-DD')`, revenue: net, orders: n })
      .from(schema.orders)
      .where(paidWhere(since))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        name: schema.orderItems.name,
        units: sql<number>`sum(${schema.orderItems.quantity})::int`,
        revenue: sql<number>`sum(${schema.orderItems.quantity} * ${schema.orderItems.unitAmount})::int`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, sql`${schema.orders.id} = ${schema.orderItems.orderId}`)
      .where(paidWhere(since))
      .groupBy(schema.orderItems.name)
      .orderBy(desc(sql`3`))
      .limit(8),
    db
      .select({
        started: n,
        paid: sql<number>`count(*) filter (where ${schema.orders.paidAt} is not null)::int`,
      })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, since)),
    db.select({ total: n, recent: sql<number>`count(*) filter (where ${schema.subscribers.createdAt} >= ${since.toISOString()})::int` }).from(schema.subscribers),
    db.select({ amount: sql<number>`coalesce(sum(${schema.orders.refundedAmount}),0)::int` }).from(schema.orders).where(paidWhere(since)),
  ]);

  const aov = cur.orders ? Math.round(cur.revenue / cur.orders) : 0;
  const change = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
  const conversion = abandon.started ? Math.round((abandon.paid / abandon.started) * 100) : 0;

  // Fill missing days so the chart has one bar per day.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, revenue: byDay.get(d)?.revenue ?? 0, orders: byDay.get(d)?.orders ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.revenue));

  const tiles = [
    { label: "Net revenue", value: formatMoney(cur.revenue), delta: change(cur.revenue, prev.revenue) },
    { label: "Orders", value: String(cur.orders), delta: change(cur.orders, prev.orders) },
    { label: "Avg. order value", value: formatMoney(aov), delta: null },
    { label: "Checkout conversion", value: `${conversion}%`, sub: `${abandon.paid} of ${abandon.started} checkouts` },
    { label: "Refunded", value: formatMoney(refunds.amount) },
    { label: "Subscribers", value: String(subs.total), sub: `+${subs.recent} this period` },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-[900] uppercase">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <a key={d} href={`/admin/analytics?days=${d}`} className={`border px-4 py-2 text-[11px] tracking-[0.12em] uppercase ${d === days ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}>
              {d} days
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white p-5">
            <p className="text-[10px] tracking-[0.14em] text-ash uppercase">{t.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{t.value}</p>
            {"delta" in t && t.delta != null && (
              <p className={`mt-1 text-xs ${t.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {t.delta >= 0 ? "▲" : "▼"} {Math.abs(t.delta)}% vs previous {days} days
              </p>
            )}
            {"sub" in t && t.sub && <p className="mt-1 text-xs text-ash">{t.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="label font-semibold">Revenue per day</h2>
          <span className="text-xs text-ash">Peak {formatMoneyShort(max)}</span>
        </div>
        <div className="flex h-56 items-end gap-[2px]" role="img" aria-label={`Daily revenue for the last ${days} days`}>
          {series.map((s) => (
            <div key={s.day} className="group relative flex-1" style={{ height: "100%" }}>
              <div className="absolute inset-x-0 bottom-0 bg-ink/85 group-hover:bg-ink" style={{ height: `${(s.revenue / max) * 100}%`, minHeight: s.revenue ? 2 : 0 }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
                {s.day}: {formatMoneyShort(s.revenue)} · {s.orders} orders
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ash">
          <span>{series[0].day}</span>
          <span>{series.at(-1)!.day}</span>
        </div>
      </div>

      <div className="mt-6 bg-white p-6">
        <h2 className="label mb-4 font-semibold">Top products</h2>
        {top.length === 0 ? (
          <AdminEmpty compact icon={BarChart3} title="No sales yet" body={`Best sellers for the last ${days} days appear here once orders come in.`} />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] tracking-[0.14em] text-ash uppercase">
              <tr><th className="pb-3 font-medium">Product</th><th className="pb-3 text-right font-medium">Units</th><th className="pb-3 text-right font-medium">Revenue</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {top.map((t) => (
                <tr key={t.name}>
                  <td className="py-3">{t.name}</td>
                  <td className="py-3 text-right tabular-nums">{t.units}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
