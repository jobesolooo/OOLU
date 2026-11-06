import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { adminUsername } from "@/lib/admin-auth";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { getDb, schema } from "@/lib/db";
import { AdminNav } from "./AdminNav";

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
  const badges = await counts();

  return (
    <div className="min-h-svh bg-mist lg:flex">
      <AdminNav badges={badges} name={user.name || adminUsername()} stripeUrl={stripe ? stripeDashboardUrl("/payments") : null} />
      <div className="min-w-0 flex-1">
        {!stripe && (
          <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
            <p className="px-[clamp(20px,3vw,48px)] py-3 text-xs">
              Stripe isn&apos;t connected — the store is showing demo products and checkout, discounts and gift card sales are off. Add{" "}
              <code>STRIPE_SECRET_KEY</code>.
            </p>
          </div>
        )}
        <div className="mx-auto w-full max-w-[1400px] px-[clamp(16px,3vw,48px)] py-[clamp(24px,4vw,56px)]">{children}</div>
      </div>
    </div>
  );
}
