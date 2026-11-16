import Image from "next/image";
import Link from "next/link";
import { and, gte, inArray, sql } from "drizzle-orm";
import { BarChart3, Eye, MousePointerClick, Radio, Search, ShoppingBag, Sparkles, TrendingDown, TrendingUp, Users } from "lucide-react";
import { AdminEmpty } from "../Empty";
import { getDb, schema } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/schema";
import { cx, formatDate, formatMoney, formatMoneyShort } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { getProducts } from "@/lib/catalog";
import {
  activityHeatmap,
  activityTotals,
  breakdown,
  customerInsights,
  dailyVisitors,
  funnel,
  liveNow,
  productPerformance,
  sources,
  topClicks,
  topPages,
  topSearches,
} from "@/lib/insights";
import { AdminHeader, Panel, Segmented, StatTile } from "../ui";
import { AutoRefresh } from "./AutoRefresh";

const PAID: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded", "refunded"];
const DAY = 86_400_000;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const change = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
const ago = (d: Date | string | null, now: number) => {
  if (!d) return "";
  const s = Math.max(0, Math.round((now - new Date(d).getTime()) / 1000));
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`;
};
const PAGE_NAMES: Record<string, string> = { "/": "Home", "/shop": "Shop", "/cart": "Bag", "/search": "Search", "/account": "My account", "/gift-cards": "Gift cards", "/journal": "Journal" };
const pageNamer = (bySlug: Map<string, string>) => (p: string) => PAGE_NAMES[p] ?? (p.startsWith("/products/") ? (bySlug.get(decodeURIComponent(p.split("/")[2] ?? "")) ?? p) : p);

/** Horizontal bars with a label, a value and its share of the top value. */
function Bars({ rows, empty, format = String }: { rows: { label: string; value: number; sub?: string; href?: string }[]; empty: string; format?: (n: number) => string }) {
  if (!rows.length) return <p className="py-6 text-center text-[12px] text-ash">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="relative">
          <div className="absolute inset-y-0 left-0 bg-accent/15" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden />
          <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[13px]">
            <span className="min-w-0 truncate" title={r.label}>
              {r.href ? (
                <Link href={r.href} className="hover:underline">
                  {r.label}
                </Link>
              ) : (
                r.label
              )}
              {r.sub && <span className="ml-2 text-[11px] text-ash">{r.sub}</span>}
            </span>
            <span className="shrink-0 tabular-nums">{format(r.value)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const raw = (await searchParams).days;
  const days = [1, 7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const now = nowMs();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(now - 2 * days * DAY);
  const db = await getDb();

  const net = sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}), 0)::int`;
  const n = sql<number>`count(*)::int`;
  const paidWhere = (from: Date, to?: Date) => and(inArray(schema.orders.status, PAID), gte(schema.orders.paidAt, from), to ? sql`${schema.orders.paidAt} < ${to.toISOString()}` : undefined);

  const [[cur], [prev], daily, act, actPrev, flow, visitorsByDay, pages, perf, src, devices, countries, searches, clicks, heat, live, people, products, [refunds]] = await Promise.all([
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidWhere(since)),
    db.select({ revenue: net, orders: n }).from(schema.orders).where(paidWhere(prevSince, since)),
    db
      .select({ day: sql<string>`to_char(${schema.orders.paidAt} at time zone 'Europe/Amsterdam', ${sql.raw(days === 1 ? "'YYYY-MM-DD HH24'" : "'YYYY-MM-DD'")})`, revenue: net, orders: n })
      .from(schema.orders)
      .where(paidWhere(since))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    activityTotals(since),
    activityTotals(prevSince, since),
    funnel(since),
    dailyVisitors(since, days === 1 ? "hour" : "day"),
    topPages(since),
    productPerformance(since),
    sources(since),
    breakdown(since, "device"),
    breakdown(since, "country"),
    topSearches(since),
    topClicks(since),
    activityHeatmap(since),
    liveNow(),
    customerInsights(since),
    getProducts(),
    db.select({ amount: sql<number>`coalesce(sum(${schema.orders.refundedAmount}),0)::int` }).from(schema.orders).where(paidWhere(since)),
  ]);

  const byId = new Map(products.map((p) => [p.id, p]));
  const pageName = pageNamer(new Map(products.map((p) => [p.slug, p.name])));
  const aov = cur.orders ? Math.round(cur.revenue / cur.orders) : 0;
  const tracking = act.pageviews > 0;

  // One bar per day (Amsterdam dates), or per hour for the 24-hour view.
  const hourly = days === 1;
  const ams = (t: number) => new Date(t).toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam", hour12: false }); // "YYYY-MM-DD HH:mm:ss"
  const dayKey = (t: number) => (hourly ? ams(t).slice(0, 13) : ams(t).slice(0, 10));
  const span = hourly ? 24 : days;
  const step = hourly ? 3_600_000 : DAY;
  const vMap = new Map(visitorsByDay.map((d) => [d.day, d]));
  const rMap = new Map(daily.map((d) => [d.day, d]));
  const label = (k: string) => (hourly ? `${k.slice(11)}:00` : formatDate(k));
  const series = Array.from({ length: span }, (_, i) => {
    const d = dayKey(now - (span - 1 - i) * step);
    return { day: d, visitors: vMap.get(d)?.visitors ?? 0, pageviews: vMap.get(d)?.pageviews ?? 0, revenue: rMap.get(d)?.revenue ?? 0, orders: rMap.get(d)?.orders ?? 0 };
  });
  const maxV = Math.max(1, ...series.map((s) => s.visitors));
  const maxR = Math.max(1, ...series.map((s) => s.revenue));

  // Products: what's working and what needs a look.
  const rows = perf
    .map((p) => ({ ...p, product: byId.get(p.productId), addRate: pct(p.adds, p.viewers || p.views) }))
    .filter((p) => p.product);
  const doingWell = [...rows].sort((a, b) => b.revenue - a.revenue || b.adds - a.adds || b.views - a.views).filter((r) => r.adds > 0 || r.units > 0).slice(0, 5);
  const avgViews = rows.length ? rows.reduce((s, r) => s + r.views, 0) / rows.length : 0;
  const attention = rows
    .filter((r) => r.views >= Math.max(5, avgViews * 0.5) && r.addRate < 5 && r.units === 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const mostViewed = [...rows].sort((a, b) => b.views - a.views).slice(0, 10);

  const steps = [
    { label: "Visited the store", value: flow.visited },
    { label: "Looked at a product", value: flow.viewedProduct },
    { label: "Added to bag", value: flow.addedToBag },
    { label: "Started checkout", value: flow.startedCheckout },
    { label: "Paid", value: flow.paid },
  ];

  const heatMax = Math.max(1, ...heat.map((h) => h.visitors));
  const heatAt = new Map(heat.map((h) => [`${h.dow}-${h.hour}`, h.visitors]));
  const busiest = [...heat].sort((a, b) => b.visitors - a.visitors)[0];
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const tiles = [
    { label: "Visitors", value: act.visitors.toLocaleString("en-GB"), delta: change(act.visitors, actPrev.visitors), sub: `${act.signedIn} signed in` },
    { label: "Page views", value: act.pageviews.toLocaleString("en-GB"), delta: change(act.pageviews, actPrev.pageviews), sub: act.visitors ? `${(act.pageviews / act.visitors).toFixed(1)} per visitor` : undefined },
    { label: "Product views", value: act.productViews.toLocaleString("en-GB"), delta: change(act.productViews, actPrev.productViews) },
    { label: "Added to bag", value: act.addToCart.toLocaleString("en-GB"), delta: change(act.addToCart, actPrev.addToCart), sub: `${act.wishlist} wishlist saves` },
    { label: "Checkouts started", value: act.checkouts.toLocaleString("en-GB"), delta: change(act.checkouts, actPrev.checkouts) },
    { label: "Visitor → order", value: `${act.visitors ? ((cur.orders / act.visitors) * 100).toFixed(1) : "0.0"}%`, sub: `${cur.orders} orders from ${act.visitors} visitors` },
  ];
  const sales = [
    { label: "Net revenue", value: formatMoney(cur.revenue), delta: change(cur.revenue, prev.revenue) },
    { label: "Orders", value: String(cur.orders), delta: change(cur.orders, prev.orders) },
    { label: "Avg. order value", value: formatMoney(aov) },
    { label: "Refunded", value: formatMoney(refunds.amount) },
  ];
  const periodLabel = days === 1 ? "the last 24 hours" : `the last ${days} days`;

  return (
    <>
      <AutoRefresh seconds={60} />
      <AdminHeader
        eyebrow="Store"
        title="Analytics"
        description={`How shoppers find, browse and buy over ${periodLabel}, compared with the period before. Counted without cookies; staff and bots aren't included.`}
        actions={<Segmented items={[1, 7, 30, 90].map((d) => ({ href: `/admin/analytics?days=${d}`, label: d === 1 ? "24 h" : `${d} days`, active: d === days }))} />}
      />

      {/* Live */}
      <section className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="relative isolate overflow-hidden bg-ink p-5 text-white sm:p-6">
          <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-emerald-400/20 blur-3xl" />
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-emerald-300 uppercase">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            On the store now
          </p>
          <p className="mt-3 font-wordmark text-[56px] leading-[0.85] tabular-nums">{live.visitors}</p>
          <p className="mt-2 text-[12px] text-white/55">visitors in the last 5 minutes · updates every minute</p>
          {live.pages.length > 0 && (
            <ul className="mt-4 space-y-1 text-[12px] text-white/80">
              {live.pages.map((p) => (
                <li key={p.path} className="flex justify-between gap-3">
                  <span className="truncate">{pageName(p.path)}</span>
                  <span className="tabular-nums text-white/50">{p.visitors}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Panel title="Customers active in the last 15 minutes" action={{ label: "All customers", href: "/admin/customers?sort=active" }}>
          {live.people.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-ash">No signed-in customers right now. Guests are counted on the left.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {live.people.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/customers/${p.id}`} className="flex items-center gap-3 p-2 ring-1 ring-black/5 transition hover:bg-mist">
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-accent/25 font-semibold text-[#5a44cf] uppercase">
                      {(p.name || p.email).charAt(0)}
                      {now - new Date(p.lastSeenAt!).getTime() < 5 * 60_000 && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
                    </span>
                    <span className="min-w-0 text-[12px]">
                      <span className="block truncate font-medium text-[13px]">{p.name || p.email}</span>
                      <span className="block truncate text-ash">
                        {ago(p.lastSeenAt, now)}
                        {p.path && ` · ${pageName(p.path)}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {!tracking && (
        <p className="mb-3 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 ring-1 ring-amber-600/20">
          Visitor numbers start counting from today: this period has no store visits recorded yet. Sales below include everything.
        </p>
      )}

      {/* Shoppers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {tiles.map((t, i) => (
          <StatTile key={t.label} index={i} dark={i === 0} label={t.label} value={t.value} delta={"delta" in t ? t.delta : undefined} deltaLabel="vs prev." sub={t.sub} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel title={hourly ? "Visitors per hour" : "Visitors per day"}>
          <div className="flex h-48 items-end gap-[2px]" role="img" aria-label={`Visitors per day for ${periodLabel}`}>
            {series.map((s) => (
              <div key={s.day} className="group relative h-full flex-1">
                <div className="absolute inset-x-0 bottom-0 bg-accent/70 transition-colors group-hover:bg-accent" style={{ height: `${(s.visitors / maxV) * 100}%`, minHeight: s.visitors ? 2 : 0 }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
                  {label(s.day)}: {s.visitors} visitors · {s.pageviews} views · {s.orders} orders
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ash">
            <span>{label(series[0].day)}</span>
            <span>{hourly ? "Now" : "Today"}</span>
          </div>
        </Panel>

        <Panel title="From visit to order">
          <ol className="space-y-2.5">
            {steps.map((s, i) => {
              const w = pct(s.value, steps[0].value || 1);
              const drop = i > 0 && steps[i - 1].value ? 100 - pct(s.value, steps[i - 1].value) : null;
              return (
                <li key={s.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
                    <span className="font-medium">{s.label}</span>
                    <span className="tabular-nums">
                      {s.value.toLocaleString("en-GB")} <span className="text-ash">· {i === 0 ? "100" : w}%</span>
                    </span>
                  </div>
                  <div className="h-3 bg-black/5">
                    <div className={cx("h-full", i === steps.length - 1 ? "bg-emerald-600" : "bg-ink/80")} style={{ width: `${Math.max(w, s.value ? 1 : 0)}%` }} />
                  </div>
                  {drop !== null && drop > 0 && <p className="mt-0.5 text-[11px] text-ash">{drop}% didn&apos;t continue</p>}
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      {/* Products */}
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel title="Doing well">
          {doingWell.length === 0 ? (
            <AdminEmpty compact icon={TrendingUp} title="Nothing yet" body="Products that get added to bags and sold show up here." />
          ) : (
            <ul className="divide-y divide-black/5">
              {doingWell.map((r) => (
                <ProductRow key={r.productId} r={r} note={r.units ? `${r.units} sold · ${formatMoney(r.revenue)}` : `${r.adds} added to bag`} tone="good" />
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Needs attention">
          {attention.length === 0 ? (
            <AdminEmpty compact icon={Sparkles} title="All good" body="Products that get looked at a lot but rarely added to the bag appear here, so you can check their price, photos or sizes." />
          ) : (
            <ul className="divide-y divide-black/5">
              {attention.map((r) => (
                <ProductRow key={r.productId} r={r} note={`${r.views} views · ${r.addRate}% added to bag · none sold`} tone="warn" />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Most viewed products" className="mt-3" flush>
        {mostViewed.length === 0 ? (
          <div className="p-5">
            <AdminEmpty compact icon={Eye} title="No product views yet" body="Once shoppers open product pages, you'll see which ones they look at and buy." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-[10px] tracking-[0.14em] text-ash uppercase">
                <tr className="border-b border-black/5">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 text-right font-medium">Views</th>
                  <th className="px-3 py-3 text-right font-medium">Added to bag</th>
                  <th className="px-3 py-3 text-right font-medium">Wishlist</th>
                  <th className="px-3 py-3 text-right font-medium">Sold</th>
                  <th className="px-5 py-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {mostViewed.map((r) => (
                  <tr key={r.productId}>
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-3">
                        <span className="relative aspect-[4/5] w-8 shrink-0 overflow-hidden bg-stone">
                          {r.product!.images[0] && <Image src={r.product!.images[0]} alt="" fill sizes="32px" className="object-cover" />}
                        </span>
                        <span className="truncate">{r.product!.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.views}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.adds} <span className="text-[11px] text-ash">({r.addRate}%)</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.wishlist}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.units}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{formatMoney(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Where they come from */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Where visitors come from">
          <Bars rows={src.map((s) => ({ label: s.source, value: s.visitors }))} empty="No visits yet." />
        </Panel>
        <Panel title="Devices">
          <Bars rows={devices.map((d) => ({ label: d.label, value: d.visitors, sub: `${pct(d.visitors, act.visitors)}%` }))} empty="No visits yet." />
        </Panel>
        <Panel title="Countries">
          <Bars
            rows={countries.map((c) => {
              let name = c.label;
              try {
                if (/^[A-Z]{2}$/.test(c.label)) name = new Intl.DisplayNames(["en"], { type: "region" }).of(c.label) ?? c.label;
              } catch {}
              return { label: name, value: c.visitors };
            })}
            empty="No visits yet."
          />
        </Panel>
      </div>

      {/* What they do */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Top pages">
          <Bars rows={pages.map((p) => ({ label: pageName(p.path), value: p.views, sub: `${p.visitors} visitors` }))} empty="No page views yet." />
        </Panel>
        <Panel title="Most clicked">
          <Bars rows={clicks.map((c) => ({ label: c.label ?? "", value: c.n }))} empty="No clicks yet." />
        </Panel>
        <Panel title="What shoppers search for">
          <Bars rows={searches.top.map((s) => ({ label: s.term ?? "", value: s.n, sub: `${s.results} results` }))} empty="No searches yet." />
          {searches.none.length > 0 && (
            <div className="mt-4 border-t border-black/5 pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-amber-800 uppercase">
                <Search className="size-3.5" /> Searched, nothing found
              </p>
              <p className="text-[12px] text-black/70">{searches.none.map((s) => `“${s.term}”${s.n > 1 ? ` ×${s.n}` : ""}`).join(", ")}</p>
              <p className="mt-1 text-[11px] text-ash">Ideas for new products, or words to add to product descriptions.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* When */}
      <Panel title="When shoppers are around" className="mt-3">
        {heat.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-ash">No visits yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="grid min-w-[620px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px] text-[10px] text-ash">
                <span />
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="text-center">
                    {h % 3 === 0 ? `${h}h` : ""}
                  </span>
                ))}
                {DOW.map((d, i) => (
                  <div key={d} className="contents">
                    <span className="self-center">{d}</span>
                    {Array.from({ length: 24 }, (_, h) => {
                      const v = heatAt.get(`${i + 1}-${h}`) ?? 0;
                      return <span key={h} title={`${d} ${h}:00 · ${v} visitors`} className="aspect-square rounded-[2px]" style={{ background: v ? `rgba(90,68,207,${0.12 + 0.88 * (v / heatMax)})` : "rgba(0,0,0,0.04)" }} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
            {busiest && (
              <p className="mt-3 text-[12px] text-ash">
                Busiest: <strong className="text-ink">{DOW[busiest.dow - 1]} around {busiest.hour}:00</strong> (Amsterdam time). A good moment for drops, posts and emails.
              </p>
            )}
          </>
        )}
      </Panel>

      {/* Customers */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
        <Users className="size-4" /> Customers
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Customer accounts" value={String(people.accounts.total)} sub={`+${people.accounts.recent} in ${periodLabel}`} />
        <StatTile label="Buyers this period" value={String(people.periodBuyers.total)} sub={`${people.periodBuyers.returning} came back for more`} />
        <StatTile label="Repeat customers" value={`${pct(people.buyers.repeat, people.buyers.total)}%`} sub={`${people.buyers.repeat} of ${people.buyers.total} buyers ordered more than once`} />
        <StatTile label="Signed in while browsing" value={`${pct(act.signedIn, act.visitors)}%`} sub={`${act.signedIn} customers`} />
      </div>
      <Panel title="Best customers this period" className="mt-3" action={{ label: "All customers", href: "/admin/customers" }} flush>
        {people.top.length === 0 ? (
          <div className="p-5">
            <AdminEmpty compact icon={ShoppingBag} title="No orders yet" body={`Customers who order in ${periodLabel} appear here.`} />
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {people.top.map((c) => (
              <li key={`${c.userId}-${c.email}`} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                <span className="min-w-0">
                  {c.userId ? (
                    <Link href={`/admin/customers/${c.userId}`} className="font-medium hover:underline">
                      {c.name || c.email}
                    </Link>
                  ) : (
                    <span className="font-medium">{c.email}</span>
                  )}
                  <span className="block text-[11px] text-ash">
                    {c.orders} order{c.orders === 1 ? "" : "s"} · last {formatDate(c.last)}
                    {!c.userId && " · guest"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(c.spent)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Sales */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
        <BarChart3 className="size-4" /> Sales
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {sales.map((t, i) => (
          <StatTile key={t.label} index={i} dark={i === 0} label={t.label} value={t.value} delta={"delta" in t ? t.delta : undefined} deltaLabel="vs prev." />
        ))}
      </div>
      <Panel title={hourly ? "Revenue per hour" : "Revenue per day"} className="mt-3">
        <div className="flex h-48 items-end gap-[2px]" role="img" aria-label={`Daily revenue for ${periodLabel}`}>
          {series.map((s) => (
            <div key={s.day} className="group relative h-full flex-1">
              <div className="absolute inset-x-0 bottom-0 bg-ink/85 transition-colors group-hover:bg-accent" style={{ height: `${(s.revenue / maxR) * 100}%`, minHeight: s.revenue ? 2 : 0 }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
                {label(s.day)}: {formatMoneyShort(s.revenue)} · {s.orders} orders
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ash">
          <span>{label(series[0].day)}</span>
          <span>{maxR > 1 ? `Peak ${formatMoneyShort(maxR)}` : "No sales yet"}</span>
        </div>
      </Panel>

      <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ash">
        <span className="flex items-center gap-1.5">
          <Radio className="size-3.5" /> No cookies: visitors are counted per day with an anonymous code that changes daily.
        </span>
        <span className="flex items-center gap-1.5">
          <MousePointerClick className="size-3.5" /> Shoppers who ask browsers not to track them (Do Not Track / GPC) aren&apos;t counted.
        </span>
      </p>
    </>
  );
}

function ProductRow({
  r,
  note,
  tone,
}: {
  r: { productId: string; product?: { name: string; images: string[]; slug: string }; views: number };
  note: string;
  tone: "good" | "warn";
}) {
  const Icon = tone === "good" ? TrendingUp : TrendingDown;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden bg-stone">
        {r.product!.images[0] && <Image src={r.product!.images[0]} alt="" fill sizes="40px" className="object-cover" />}
      </span>
      <span className="min-w-0 flex-1 text-[13px]">
        <span className="block truncate font-medium">{r.product!.name}</span>
        <span className="block text-[11px] text-ash">{note}</span>
      </span>
      <Icon className={cx("size-4 shrink-0", tone === "good" ? "text-emerald-600" : "text-amber-600")} />
    </li>
  );
}
