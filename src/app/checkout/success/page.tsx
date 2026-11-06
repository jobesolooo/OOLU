import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrderBySession, markOrderPaid } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const raw = (await searchParams).session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;

  let data = sessionId ? await getOrderBySession(sessionId) : null;

  // If the webhook hasn't landed yet, confirm with Stripe directly (idempotent).
  if (sessionId && data?.order.status === "pending" && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const paid = await markOrderPaid(session);
      if (paid) data = paid;
    } catch (err) {
      console.error("[success] could not verify session", err);
    }
  }

  if (!data) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display text-4xl font-[900] uppercase">Thanks!</h1>
        <p className="mt-4 text-sm text-ash">We couldn&apos;t find that order, but if you paid you&apos;ll get a confirmation email shortly.</p>
        <Link href="/shop" className="btn-solid mt-8">Keep shopping</Link>
      </div>
    );
  }

  const { order, items } = data;
  const paid = order.status !== "pending" && order.status !== "cancelled";

  return (
    <div className="container-x max-w-3xl py-16">
      {paid && <ClearCart />}
      <p className="text-[10px] tracking-[0.3em] text-ash uppercase">Order #{order.number}</p>
      <h1 className="mt-3 font-display text-4xl font-[900] uppercase md:text-5xl">
        {paid ? "You're all set." : "Processing payment…"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-black/75">
        {paid
          ? `Thanks for rolling with ${site.name}. A confirmation is on its way to ${order.email ?? "your inbox"}.`
          : "Your payment is still being confirmed. Refresh in a moment — we'll email you as soon as it clears."}
      </p>

      <ul className="mt-10 divide-y divide-black/10 border-y border-black/10">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-4">
            <div className="relative size-16 shrink-0 bg-stone">
              {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-ash">
                {i.size && i.size !== "One Size" ? `Size ${i.size} · ` : ""}Qty {i.quantity}
              </p>
            </div>
            <p className="text-sm">{formatMoney(i.unitAmount * i.quantity, order.currency)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-ash">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd>{formatMoney(order.shipping, order.currency)}</dd></div>
        {order.tax > 0 && <div className="flex justify-between"><dt className="text-ash">Tax</dt><dd>{formatMoney(order.tax, order.currency)}</dd></div>}
        <div className="flex justify-between border-t border-black/10 pt-2 font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
      </dl>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-solid">Keep shopping</Link>
        <Link href="/account" className="btn-outline border-ink py-3 text-[11px] hover:bg-ink hover:text-white">Your account</Link>
      </div>
    </div>
  );
}
