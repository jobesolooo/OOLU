import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const stripe = isStripeConfigured();
  return (
    <div className="bg-mist">
      <div className="border-b border-black/10 bg-white">
        <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-2 py-4">
          <span className="font-display text-sm font-[900] tracking-[0.12em] uppercase">Admin</span>
          <nav className="flex flex-wrap gap-6 text-[11px] font-medium tracking-[0.14em] uppercase">
            <Link href="/admin" className="hover:underline">Orders</Link>
            <Link href="/admin/inventory" className="hover:underline">Products & stock</Link>
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
            Stripe isn&apos;t connected — the store is showing demo products and checkout is off. Add <code>STRIPE_SECRET_KEY</code> to the environment.
          </p>
        </div>
      )}
      <div className="container-x py-10">{children}</div>
    </div>
  );
}
