import Image from "next/image";
import Link from "next/link";
import { and, desc, gte, inArray, sql } from "drizzle-orm";
import { ArrowRight, Inbox, PackageCheck, PackageOpen, RotateCcw, TriangleAlert, type LucideIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { adminUsername } from "@/lib/admin-auth";
import { getDb, schema } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/schema";
import { getProducts } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { allVariantKeys, variantLabel } from "@/lib/variants";
import { cx, formatDate, formatMoney, formatMoneyShort } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AdminEmpty } from "./Empty";
import { AdminHeader, Panel, StatTile } from "./ui";

const PAID: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded", "refunded"];
const DAY = 86_400_000;
const LOW = 3;

function greeting(now: number) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Amsterdam" }).format(now));
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Smooth-ish area chart of daily revenue, drawn as plain SVG. */
function RevenueChart({ series }: { series: { day: string; revenue: number; orders: number }[] }) {
  const W = 600;
  const H = 180;
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const step = W / Math.max(1, series.length - 1);
  const pts = series.map((s, i) => [i * step, H - (s.revenue / max) * (H - 16) - 4] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[200px] w-full overflow-visible" role="img" aria-label="Revenue per day, last 14 days">
        <defs>
          <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a592ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a592ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity="0.07" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#rev-fill)" />
        <path d={line} fill="none" stroke="#0d0d0d" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      {/* hover targets with tooltips */}
      <div className="absolute inset-0 flex">
        {series.map((s, i) => (
          <div key={s.day} className="group relative flex-1">
            <span
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-accent opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: i === 0 ? 0 : i === series.length - 1 ? "100%" : "50%", top: `${(pts[i][1] / H) * 100}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
              {formatDate(s.day)} · {formatMoneyShort(s.revenue)} · {s.orders} {s.orders === 1 ? "order" : "orders"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Todo({ icon: Icon, n, label, href, hint }: { icon: LucideIcon; n: number; label: string; href: string; hint: string }) {
  const hot = n > 0;
  return (
    <Link
      href={href}
      className={cx(
        "group flex items-center gap-4 p-4 transition-colors",
        hot ? "bg-accent/15 hover:bg-accent/25" : "hover:bg-mist",
      )}
    >
      <span className={cx("grid size-10 shrink-0 place-items-center rounded-full", hot ? "bg-accent text-ink" : "bg-mist text-ash")}>
        <Icon className="size-[18px]" strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block truncate text-[12px] text-ash">{hint}</span>
      </span>
      <span className={cx("font-wordmark text-[30px] leading-none tabular-nums", !hot && "text-black/25")}>{n}</span>
      <ArrowRight className="size-4 shrink-0 text-ash transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
    </Link>
  );
}

export default async function AdminOverview() {
  const user = await requireAdmin();
  const now = nowMs();
  const db = await getDb();
  const net = sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}), 0)::int`;
  const n = sql<number>`count(*)::int`;
  const paidSince = (from: number, to?: number) =>
    and(
      inArray(schema.orders.status, PAID),
      gte(schema.orders.paidAt, new Date(from)),
      to ? sql`${schema.orders.paidAt} < ${new Date(to).toISOString()}` : undefined,
    );
  const startOfToday = new Date(new Date(now).toISOString().slice(0, 10)).getTime();

  const [[today], [cur], [prev], daily, recent, top, [toShip], [openReturns], [newMessages], [newReviews], products, stock] = await Promise.all([
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidSince(startOfToday)),
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidSince(now - 30 * DAY)),
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidSince(now - 60 * DAY, now - 30 * DAY)),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${schema.orders.paidAt}), 'YYYY-MM-DD')`, revenue: net, orders: n })
      .from(schema.orders)
      .where(paidSince(now - 14 * DAY))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db.select().from(schema.orders).where(inArray(schema.orders.status, PAID)).orderBy(desc(schema.orders.createdAt)).limit(6),
    db
      .select({
        productId: schema.orderItems.productId,
        name: schema.orderItems.name,
        units: sql<number>`sum(${schema.orderItems.quantity})::int`,
        revenue: sql<number>`sum(${schema.orderItems.quantity} * ${schema.orderItems.unitAmount})::int`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, sql`${schema.orders.id} = ${schema.orderItems.orderId}`)
      .where(paidSince(now - 30 * DAY))
      .groupBy(schema.orderItems.productId, schema.orderItems.name)
      .orderBy(desc(sql`4`))
      .limit(5),
    db.select({ n }).from(schema.orders).where(inArray(schema.orders.status, ["paid", "fulfilled"])),
    db.select({ n }).from(schema.returnRequests).where(inArray(schema.returnRequests.status, ["requested", "approved", "received"])),
    db.select({ n }).from(schema.contactMessages).where(sql`${schema.contactMessages.status} = 'new'`),
    db.select({ n }).from(schema.reviews).where(gte(schema.reviews.createdAt, new Date(now - 7 * DAY))),
    getProducts(),
    getStockMap(),
  ]);

  const change = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
  const aov = cur.orders ? Math.round(cur.revenue / cur.orders) : 0;
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY).toISOString().slice(0, 10);
    return { day: d, revenue: byDay.get(d)?.revenue ?? 0, orders: byDay.get(d)?.orders ?? 0 };
  });
  const fortnight = series.reduce((s, d) => s + d.revenue, 0);

  const images = new Map(products.map((p) => [p.id, p.images[0]]));
  const low = products
    .flatMap((p) =>
      allVariantKeys(p).flatMap((size) => {
        const left = stock.get(stockKey(p.id, size));
        return left !== undefined && left <= LOW ? [{ id: p.id, name: p.name, image: p.images[0], size, left }] : [];
      }),
    )
    .sort((a, b) => a.left - b.left);
  const soldOut = low.filter((l) => l.left === 0).length;

  const name = user.name || adminUsername();
  const dateLine = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(now);

  return (
    <>
      <AdminHeader
        eyebrow={dateLine}
        title={`${greeting(now)}, ${name}.`}
        description={
          toShip.n
            ? `${toShip.n} ${toShip.n === 1 ? "order is" : "orders are"} waiting to be packed. Here's how the store is doing.`
            : "Nothing is waiting to ship. Here's how the store is doing."
        }
        actions={
          <Link href="/admin/orders" className="btn-solid gap-2">
            Open orders <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile dark index={0} label="Today" value={formatMoneyShort(today.revenue)} sub={`${today.orders} ${today.orders === 1 ? "order" : "orders"} so far`} />
        <StatTile index={1} label="Last 30 days" value={formatMoneyShort(cur.revenue)} delta={change(cur.revenue, prev.revenue)} deltaLabel="vs prev." href="/admin/analytics" />
        <StatTile index={2} label="Orders · 30 days" value={String(cur.orders)} delta={change(cur.orders, prev.orders)} deltaLabel="vs prev." href="/admin/orders?filter=all" />
        <StatTile index={3} label="Avg. order" value={formatMoneyShort(aov)} sub="Net of refunds" />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Revenue · last 14 days" action={{ label: "Analytics", href: "/admin/analytics" }}>
          <p className="font-wordmark text-[44px] leading-none tabular-nums">{formatMoney(fortnight)}</p>
          <div className="mt-6">
            <RevenueChart series={series} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ash">
            <span>{formatDate(series[0].day)}</span>
            <span>Today</span>
          </div>
        </Panel>

        <Panel title="Needs attention" flush>
          <div className="divide-y divide-black/5">
            <Todo icon={PackageCheck} n={toShip.n} label="Orders to ship" hint="Paid and waiting to be packed" href="/admin/orders" />
            <Todo icon={RotateCcw} n={openReturns.n} label="Open returns" hint="Approve, receive or refund" href="/admin/returns" />
            <Todo icon={Inbox} n={newMessages.n} label="Unread messages" hint="From the contact form" href="/admin/messages" />
            <Todo icon={TriangleAlert} n={low.length} label="Low stock" hint={soldOut ? `${soldOut} ${soldOut === 1 ? "size is" : "sizes are"} sold out` : `${LOW} or fewer left`} href="/admin/inventory" />
          </div>
          <p className="border-t border-black/5 px-5 py-3 text-[12px] text-ash sm:px-6">
            {newReviews.n} new {newReviews.n === 1 ? "review" : "reviews"} this week ·{" "}
            <Link href="/admin/reviews?status=approved" className="underline hover:text-ink">
              read them
            </Link>
          </p>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Latest orders" action={{ label: "All orders", href: "/admin/orders?filter=all" }} flush>
          {recent.length === 0 ? (
            <AdminEmpty compact icon={PackageOpen} title="No orders yet" body="Paid orders show up here the moment checkout completes." action={{ label: "View the store", href: "/" }} />
          ) : (
            <ul className="divide-y divide-black/5">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-mist sm:px-6">
                    <span className="w-16 shrink-0 font-semibold">#{o.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{o.shippingAddress?.name ?? o.email ?? "—"}</span>
                      <span className="block text-[11px] text-ash">{formatDate(o.createdAt)}</span>
                    </span>
                    <span className="hidden sm:block">
                      <OrderStatusBadge status={o.status} />
                    </span>
                    <span className="w-20 text-right text-[13px] tabular-nums">{formatMoney(o.total, o.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Panel title="Best sellers · 30 days" flush>
            {top.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-ash sm:px-6">Best sellers appear once orders come in.</p>
            ) : (
              <ol className="divide-y divide-black/5">
                {top.map((t, i) => (
                  <li key={`${t.productId}-${t.name}`} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <span className="w-5 font-wordmark text-[20px] text-black/30">{i + 1}</span>
                    <span className="relative size-10 shrink-0 overflow-hidden bg-stone">
                      {images.get(t.productId ?? "") && <Image src={images.get(t.productId ?? "")!} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] uppercase">{t.name}</span>
                      <span className="block text-[11px] text-ash">{t.units} sold</span>
                    </span>
                    <span className="text-[13px] tabular-nums">{formatMoneyShort(t.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Running low" action={{ label: "Stock", href: "/admin/inventory" }} flush>
            {low.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-ash sm:px-6">All tracked sizes have more than {LOW} left.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {low.slice(0, 5).map((l) => (
                  <li key={`${l.id}-${l.size}`} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <span className="relative size-10 shrink-0 overflow-hidden bg-stone">
                      {l.image && <Image src={l.image} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] uppercase">{l.name}</span>
                      <span className="block text-[11px] text-ash">{l.size === "One Size" ? "One size" : variantLabel(l.size)}</span>
                    </span>
                    <span className={cx("rounded-full px-2.5 py-1 text-[11px] tabular-nums", l.left === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")}>
                      {l.left === 0 ? "Sold out" : `${l.left} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
