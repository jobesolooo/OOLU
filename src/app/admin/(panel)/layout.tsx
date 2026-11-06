import Link from "next/link";
import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

async function counts() {
  const db = await getDb();
  const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const n = sql<number>`count(*)::int`;
  const [orders, returns, reviews, messages] = await Promise.all([
    one(db.select({ n }).from(schema.orders).where(eq(schema.orders.status, "paid"))),
    one(db.select({ n }).from(schema.returnRequests).where(eq(schema.returnRequests.status, "requested"))),
    one(db.select({ n }).from(schema.reviews).where(eq(schema.reviews.status, "pending"))),
    one(db.select({ n }).from(schema.contactMessages).where(eq(schema.contactMessages.status, "new"))),
  ]);
  return { orders, returns, reviews, messages };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const stripe = isStripeConfigured();
  const c = await counts();
  const nav: { label: string; href: string; badge?: number }[] = [
    { label: "Orders", href: "/admin", badge: c.orders },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Products & stock", href: "/admin/inventory" },
    { label: "Returns", href: "/admin/returns", badge: c.returns },
    { label: "Reviews", href: "/admin/reviews", badge: c.reviews },
    { label: "Inbox", href: "/admin/messages", badge: c.messages },
    { label: "Discounts", href: "/admin/discounts" },
    { label: "Gift cards", href: "/admin/gift-cards" },
    { label: "Subscribers", href: "/admin/subscribers" },
    { label: "Settings", href: "/admin/settings" },
  ];
  return (
    // At least one full screen tall, so the footer never jumps up on short or empty pages.
    <div className="flex min-h-[calc(100svh-var(--chrome-h))] flex-col bg-mist">
      <div className="border-b border-black/10 bg-white">
        <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
          <span className="font-display font-normal tracking-[-0.02em] text-sm">Admin</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium tracking-[0.12em] uppercase">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="flex items-center gap-1.5 hover:underline">
                {n.label}
                {n.badge ? <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] text-white">{n.badge}</span> : null}
              </Link>
            ))}
            {stripe && (
              <a href={stripeDashboardUrl("/payments")} target="_blank" rel="noreferrer" className="hover:underline">
                Stripe ↗
              </a>
            )}
          </nav>
          <span className="ml-auto text-xs text-ash">{user.email}</span>
        </div>
      </div>
      {!stripe && (
        <div className="bg-amber-50 text-amber-900">
          <p className="container-x py-3 text-xs">
            Stripe isn&apos;t connected — the store is showing demo products and checkout, discounts and gift card sales are off. Add <code>STRIPE_SECRET_KEY</code>.
          </p>
        </div>
      )}
      <div className="container-x flex-1 py-10">{children}</div>
    </div>
  );
}
