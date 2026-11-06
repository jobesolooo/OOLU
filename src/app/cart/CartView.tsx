"use client";

import Link from "next/link";
import { useMounted } from "@/lib/use-mounted";
import { useCart, cartSubtotal } from "@/store/cart";
import { formatMoney } from "@/lib/format";
import { CartLineRow, FreeShippingMeter, useCheckout } from "@/components/CartDrawer";

export function CartView({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const lines = useCart((s) => s.lines);
  const { checkout, pending, error } = useCheckout();
  const mounted = useMounted();

  if (!mounted) return <div className="h-64" />;

  if (!lines.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ash">Your bag is empty.</p>
        <Link href="/shop" className="btn-solid mt-6">
          Shop now
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  return (
    <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-black/10 border-y border-black/10">
        {lines.map((l) => (
          <CartLineRow key={`${l.productId}|${l.size}`} line={l} />
        ))}
      </ul>
      <aside className="h-fit bg-white p-6">
        <h2 className="label font-semibold">Summary</h2>
        <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
        <div className="flex justify-between border-t border-black/10 pt-4 text-sm">
          <span>Subtotal</span>
          <span className="font-medium">{formatMoney(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-ash">Shipping and taxes calculated at checkout.</p>
        {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
        <button className="btn-solid mt-5 w-full py-4" onClick={checkout} disabled={pending}>
          {pending ? "Redirecting…" : "Checkout"}
        </button>
      </aside>
    </div>
  );
}
