import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, Package, RefreshCw, Star } from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AccountShell } from "@/components/auth/AccountShell";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const sp = await searchParams;
  const db = await getDb();
  const [orders, [wish], [reviews], returns] = await Promise.all([
    listOrdersForUser(user.id).then((o) => o.filter((x) => x.status !== "pending" && x.status !== "cancelled")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.reviews).where(eq(schema.reviews.userId, user.id)),
    db
      .select({ r: schema.returnRequests, number: schema.orders.number })
      .from(schema.returnRequests)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.returnRequests.orderId))
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.returnRequests.createdAt))
      .limit(5),
  ]);
  const openReturns = returns.filter((r) => ["requested", "approved", "received"].includes(r.r.status));
  const notice = one(sp.welcome)
    ? "Welcome to OOLU. Your account is ready."
    : one(sp.reset)
      ? "Password updated. You're signed in."
      : null;

  const stats = [
    { icon: Package, label: "Orders", value: orders.length, href: "#orders" },
    { icon: RefreshCw, label: "Open returns", value: openReturns.length, href: "#orders" },
    { icon: Heart, label: "Wishlist", value: wish.n, href: "/wishlist" },
    { icon: Star, label: "Reviews", value: reviews.n, href: "/shop" },
  ];

  return (
    <AccountShell user={user} active="orders">
      {notice && <p className="mb-8 bg-white p-5 text-[15px]">{notice}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="flex items-center gap-4 bg-white p-6 hover:bg-ink hover:text-white">
            <s.icon className="size-6" strokeWidth={1.3} />
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{s.value}</span>
              <span className="text-[11px] tracking-[0.12em] uppercase opacity-70">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      {openReturns.length > 0 && (
        <div className="mt-10 bg-white p-6">
          <h2 className="label mb-4 font-semibold">Returns in progress</h2>
          <ul className="space-y-2 text-sm">
            {openReturns.map(({ r, number }) => (
              <li key={r.id}>
                <Link href={`/account/orders/${r.orderId}`} className="underline underline-offset-4">Order #{number}</Link> — <span className="capitalize">{r.status}</span>
                <span className="text-ash"> · {formatDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 id="orders" className="eyebrow mt-14 mb-5 scroll-mt-28">Your orders</h2>
      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center">
          <p className="text-[15px] text-ash">No orders yet{!user.emailVerified ? " — confirm your email to pull in orders you placed as a guest" : ""}.</p>
          <Link href="/shop" className="btn-solid mt-6">Shop now</Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/10 bg-white">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center gap-4 p-5 hover:bg-mist sm:gap-8">
                <span className="w-20 text-[15px] font-semibold">#{o.number}</span>
                <span className="w-28 text-[13px] text-ash">{formatDate(o.createdAt)}</span>
                <OrderStatusBadge status={o.status} />
                <span className="ml-auto text-[15px] tabular-nums">{formatMoney(o.total, o.currency)}</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
