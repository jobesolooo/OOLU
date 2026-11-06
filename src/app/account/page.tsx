import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const orders = (await listOrdersForUser(user.id)).filter((o) => o.status !== "pending" && o.status !== "cancelled");

  return (
    <div className="container-x py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-ash uppercase">Account</p>
          <h1 className="mt-2 font-display text-4xl font-[900] uppercase">Hey{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm text-ash">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="btn-solid">
              Admin dashboard
            </Link>
          )}
          <form action={logout}>
            <button className="border border-black/20 px-5 py-3 text-[11px] font-semibold tracking-[0.16em] uppercase hover:border-ink">Sign out</button>
          </form>
        </div>
      </div>

      <h2 className="label mt-12 mb-4 font-semibold">Your orders</h2>
      {orders.length === 0 ? (
        <div className="bg-white p-10 text-center">
          <p className="text-sm text-ash">No orders yet.</p>
          <Link href="/shop" className="btn-solid mt-6">Shop now</Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/10 bg-white">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center gap-4 p-5 hover:bg-mist">
                <span className="w-24 text-sm font-semibold">#{o.number}</span>
                <span className="w-32 text-xs text-ash">{formatDate(o.createdAt)}</span>
                <OrderStatusBadge status={o.status} />
                <span className="ml-auto text-sm">{formatMoney(o.total, o.currency)}</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
