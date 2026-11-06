import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { OrderDetail } from "@/components/OrderDetail";

export const metadata: Metadata = { title: "Order" };

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getOrder(id) : null;
  if (!data || data.order.userId !== user.id) notFound();

  return (
    <div className="container-x py-14">
      <Link href="/account" className="text-[10px] tracking-[0.2em] text-ash uppercase hover:text-ink">← Account</Link>
      <h1 className="mt-3 mb-8 font-display text-4xl font-[900] uppercase">Order #{data.order.number}</h1>
      <OrderDetail order={data.order} items={data.items} />
    </div>
  );
}
