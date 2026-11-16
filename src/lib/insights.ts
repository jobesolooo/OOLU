import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { OrderStatus } from "./db/schema";
import { ONLINE_MS } from "./analytics";

/** Queries behind Admin → Analytics (store activity + customers). */

const E = schema.events;
const PAID: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded", "refunded"];
const TZ = sql.raw("'Europe/Amsterdam'"); // inline (not a parameter) so GROUP BY matches the SELECT

const n = sql<number>`count(*)::int`;
const visitors = sql<number>`count(distinct ${E.visitor})::int`;
const inRange = (from: Date, to?: Date) => and(gte(E.at, from), to ? lt(E.at, to) : undefined);

export async function activityTotals(from: Date, to?: Date) {
  const db = await getDb();
  const [r] = await db
    .select({
      visitors,
      pageviews: sql<number>`count(*) filter (where ${E.type} = 'pageview')::int`,
      productViews: sql<number>`count(*) filter (where ${E.type} = 'pageview' and ${E.productId} is not null)::int`,
      addToCart: sql<number>`count(*) filter (where ${E.type} = 'add_to_cart')::int`,
      wishlist: sql<number>`count(*) filter (where ${E.type} = 'wishlist_add')::int`,
      checkouts: sql<number>`count(*) filter (where ${E.type} = 'checkout_start')::int`,
      searches: sql<number>`count(*) filter (where ${E.type} = 'search')::int`,
      clicks: sql<number>`count(*) filter (where ${E.type} = 'click')::int`,
      signedIn: sql<number>`count(distinct ${E.userId})::int`,
    })
    .from(E)
    .where(inRange(from, to));
  return r;
}

/** Shoppers moving through the store, counted once per visitor (per day). */
export async function funnel(from: Date) {
  const db = await getDb();
  const [r] = await db
    .select({
      visited: visitors,
      viewedProduct: sql<number>`count(distinct ${E.visitor}) filter (where ${E.productId} is not null and ${E.type} = 'pageview')::int`,
      addedToBag: sql<number>`count(distinct ${E.visitor}) filter (where ${E.type} = 'add_to_cart')::int`,
      startedCheckout: sql<number>`count(distinct ${E.visitor}) filter (where ${E.type} = 'checkout_start')::int`,
    })
    .from(E)
    .where(gte(E.at, from));
  const [paid] = await db
    .select({ n })
    .from(schema.orders)
    .where(and(inArray(schema.orders.status, PAID), gte(schema.orders.paidAt, from)));
  return { ...r, paid: paid.n };
}

/** Visitors per day, or per hour for the 24-hour view ("YYYY-MM-DD" / "YYYY-MM-DD HH24"). */
export async function dailyVisitors(from: Date, bucket: "day" | "hour" = "day") {
  const db = await getDb();
  const day = bucket === "hour" ? sql<string>`to_char(${E.at} at time zone ${TZ}, 'YYYY-MM-DD HH24')` : sql<string>`to_char(${E.at} at time zone ${TZ}, 'YYYY-MM-DD')`;
  return db
    .select({ day, visitors, pageviews: sql<number>`count(*) filter (where ${E.type} = 'pageview')::int` })
    .from(E)
    .where(gte(E.at, from))
    .groupBy(day)
    .orderBy(day);
}

export async function topPages(from: Date, limit = 10) {
  const db = await getDb();
  return db
    .select({ path: E.path, views: n, visitors })
    .from(E)
    .where(and(gte(E.at, from), eq(E.type, "pageview")))
    .groupBy(E.path)
    .orderBy(desc(n))
    .limit(limit);
}

/** Per product: views, add-to-bag, wishlist saves, and what actually sold. */
export async function productPerformance(from: Date) {
  const db = await getDb();
  const [activity, sales] = await Promise.all([
    db
      .select({
        productId: E.productId,
        views: sql<number>`count(*) filter (where ${E.type} = 'pageview')::int`,
        viewers: sql<number>`count(distinct ${E.visitor}) filter (where ${E.type} = 'pageview')::int`,
        adds: sql<number>`count(*) filter (where ${E.type} = 'add_to_cart')::int`,
        wishlist: sql<number>`count(*) filter (where ${E.type} = 'wishlist_add')::int`,
      })
      .from(E)
      .where(and(gte(E.at, from), isNotNull(E.productId)))
      .groupBy(E.productId),
    db
      .select({
        productId: schema.orderItems.productId,
        units: sql<number>`sum(${schema.orderItems.quantity})::int`,
        revenue: sql<number>`sum(${schema.orderItems.quantity} * ${schema.orderItems.unitAmount})::int`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .where(and(inArray(schema.orders.status, PAID), gte(schema.orders.paidAt, from)))
      .groupBy(schema.orderItems.productId),
  ]);
  const map = new Map<string, { productId: string; views: number; viewers: number; adds: number; wishlist: number; units: number; revenue: number }>();
  for (const a of activity) if (a.productId) map.set(a.productId, { ...a, productId: a.productId, units: 0, revenue: 0 });
  for (const s of sales) {
    const row = map.get(s.productId) ?? { productId: s.productId, views: 0, viewers: 0, adds: 0, wishlist: 0, units: 0, revenue: 0 };
    map.set(s.productId, { ...row, units: s.units, revenue: s.revenue });
  }
  return [...map.values()];
}

/** Where visitors came from (first known source of each visitor). */
export async function sources(from: Date) {
  const db = await getDb();
  const perVisitor = db
    .select({ visitor: E.visitor, source: sql<string | null>`max(${E.source})`.as("source") })
    .from(E)
    .where(and(gte(E.at, from), eq(E.type, "pageview")))
    .groupBy(E.visitor)
    .as("v");
  const label = sql<string>`coalesce(${perVisitor.source}, 'Direct')`;
  return db.select({ source: label, visitors: n }).from(perVisitor).groupBy(label).orderBy(desc(n)).limit(10);
}

export async function breakdown(from: Date, field: "device" | "country") {
  const db = await getDb();
  const col = field === "device" ? E.device : E.country;
  const label = sql<string>`coalesce(${col}, 'Unknown')`;
  return db.select({ label, visitors }).from(E).where(gte(E.at, from)).groupBy(label).orderBy(desc(visitors)).limit(8);
}

export async function topSearches(from: Date) {
  const db = await getDb();
  const where = and(gte(E.at, from), eq(E.type, "search"));
  const [top, none] = await Promise.all([
    db
      .select({ term: E.label, n, results: sql<number>`round(avg(${E.value}))::int` })
      .from(E)
      .where(where)
      .groupBy(E.label)
      .orderBy(desc(n))
      .limit(10),
    db
      .select({ term: E.label, n })
      .from(E)
      .where(and(where, eq(E.value, 0)))
      .groupBy(E.label)
      .orderBy(desc(n))
      .limit(8),
  ]);
  return { top, none };
}

export async function topClicks(from: Date) {
  const db = await getDb();
  return db
    .select({ label: E.label, n, visitors })
    .from(E)
    .where(and(gte(E.at, from), eq(E.type, "click"), isNotNull(E.label)))
    .groupBy(E.label)
    .orderBy(desc(n))
    .limit(12);
}

/** Activity by weekday × hour (Amsterdam time): when shoppers are around. */
export async function activityHeatmap(from: Date) {
  const db = await getDb();
  const dow = sql<number>`extract(isodow from ${E.at} at time zone ${TZ})::int`;
  const hour = sql<number>`extract(hour from ${E.at} at time zone ${TZ})::int`;
  return db.select({ dow, hour, visitors }).from(E).where(gte(E.at, from)).groupBy(dow, hour);
}

/** Right now: visitors in the last 5 minutes, and signed-in customers active in the last 15. */
export async function liveNow() {
  const db = await getDb();
  const since = new Date(Date.now() - ONLINE_MS);
  const [[now], pages, people] = await Promise.all([
    db.select({ visitors }).from(E).where(gte(E.at, since)),
    db
      .select({ path: E.path, visitors })
      .from(E)
      .where(and(gte(E.at, since), eq(E.type, "pageview")))
      .groupBy(E.path)
      .orderBy(desc(visitors))
      .limit(5),
    db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, lastSeenAt: schema.users.lastSeenAt })
      .from(schema.users)
      .where(and(eq(schema.users.role, "customer"), gte(schema.users.lastSeenAt, new Date(Date.now() - 15 * 60_000))))
      .orderBy(desc(schema.users.lastSeenAt))
      .limit(12),
  ]);
  // Last page each of those customers looked at.
  const ids = people.map((p) => p.id);
  const last = ids.length
    ? await db
        .selectDistinctOn([E.userId], { userId: E.userId, path: E.path, at: E.at })
        .from(E)
        .where(and(inArray(E.userId, ids), eq(E.type, "pageview")))
        .orderBy(E.userId, desc(E.at))
    : [];
  const lastPage = new Map(last.map((l) => [l.userId, l.path]));
  return { visitors: now.visitors, pages, people: people.map((p) => ({ ...p, path: lastPage.get(p.id) ?? null })) };
}

/** Customer side: new accounts, repeat buyers, best customers. */
export async function customerInsights(from: Date) {
  const db = await getDb();
  const O = schema.orders;
  const paid = inArray(O.status, PAID);
  const buyer = sql`coalesce(${O.userId}::text, lower(${O.email}))`;
  const [[accounts], [buyers], [periodBuyers], top] = await Promise.all([
    db
      .select({ total: n, recent: sql<number>`count(*) filter (where ${schema.users.createdAt} >= ${from.toISOString()})::int` })
      .from(schema.users)
      .where(eq(schema.users.role, "customer")),
    db
      .select({ total: sql<number>`count(*)::int`, repeat: sql<number>`count(*) filter (where c > 1)::int` })
      .from(db.select({ b: sql`${buyer}`.as("b"), c: sql<number>`count(*)`.as("c") }).from(O).where(paid).groupBy(buyer).as("x")),
    db
      .select({
        total: sql<number>`count(distinct ${buyer})::int`,
        returning: sql<number>`count(distinct ${buyer}) filter (where exists (select 1 from orders o2 where coalesce(o2.user_id::text, lower(o2.email)) = ${buyer} and o2.paid_at < ${from.toISOString()} and o2.status in ('paid','fulfilled','shipped','delivered','partially_refunded','refunded')))::int`,
      })
      .from(O)
      .where(and(paid, gte(O.paidAt, from))),
    db
      .select({
        userId: O.userId,
        email: sql<string>`max(${O.email})`,
        name: sql<string | null>`max(${schema.users.name})`,
        orders: n,
        spent: sql<number>`sum(${O.total} - ${O.refundedAmount})::int`,
        last: sql<string>`max(${O.paidAt})`,
      })
      .from(O)
      .leftJoin(schema.users, eq(schema.users.id, O.userId))
      .where(and(paid, gte(O.paidAt, from)))
      .groupBy(O.userId, sql`lower(${O.email})`)
      .orderBy(desc(sql`5`))
      .limit(8),
  ]);
  return { accounts, buyers, periodBuyers, top };
}

/** Recent activity of one customer (for their page in Customers). */
export async function customerActivity(userId: string, limit = 40) {
  const db = await getDb();
  return db
    .select({ at: E.at, type: E.type, path: E.path, productId: E.productId, label: E.label, value: E.value, device: E.device })
    .from(E)
    .where(eq(E.userId, userId))
    .orderBy(desc(E.at))
    .limit(limit);
}

export async function onlineCount() {
  const db = await getDb();
  const [r] = await db.select({ visitors }).from(E).where(gte(E.at, new Date(Date.now() - ONLINE_MS)));
  return r.visitors;
}
