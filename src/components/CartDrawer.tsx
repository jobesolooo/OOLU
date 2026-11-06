"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useCart, cartSubtotal, MAX_QTY, type CartLine } from "@/store/cart";
import { formatMoney } from "@/lib/format";
import { variantLabel } from "@/lib/variants";

export function useCheckout() {
  const lines = useCart((s) => s.lines);
  const giftCard = useCart((s) => s.giftCard);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
          giftCardCode: giftCard?.code,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPending(false);
    }
  }

  return { checkout, pending, error };
}

export function CartLineRow({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/products/${line.slug}`} className="relative aspect-square w-20 shrink-0 bg-stone sm:w-24">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${line.slug}`} className="text-[13px] font-medium hover:underline">
              {line.name}
            </Link>
            {line.size !== "One Size" && <p className="mt-0.5 text-xs text-ash">{variantLabel(line.size)}</p>}
          </div>
          <button
            aria-label={`Remove ${line.name}`}
            onClick={() => remove(line.productId, line.size)}
            className="text-ash hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-black/15">
            <button
              aria-label="Decrease quantity"
              className="grid size-8 place-items-center"
              onClick={() => setQuantity(line.productId, line.size, line.quantity - 1)}
            >
              <Minus className="size-3" />
            </button>
            <span className="w-7 text-center text-xs tabular-nums">{line.quantity}</span>
            <button
              aria-label="Increase quantity"
              className="grid size-8 place-items-center disabled:opacity-30"
              disabled={line.quantity >= MAX_QTY}
              onClick={() => setQuantity(line.productId, line.size, line.quantity + 1)}
            >
              <Plus className="size-3" />
            </button>
          </div>
          <p className={compact ? "text-xs" : "text-[13px]"}>{formatMoney(line.unitAmount * line.quantity, line.currency)}</p>
        </div>
      </div>
    </li>
  );
}

export function GiftCardInput({ subtotal }: { subtotal: number }) {
  const giftCard = useCart((s) => s.giftCard);
  const setGiftCard = useCart((s) => s.setGiftCard);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (giftCard) {
    const applied = Math.min(giftCard.balance, subtotal);
    return (
      <div className="flex items-center justify-between py-2 text-[13px]">
        <span>
          Gift card <span className="font-mono">••{giftCard.code.slice(-4)}</span>
          <span className="block text-xs text-ash">Balance {formatMoney(giftCard.balance, giftCard.currency)}</span>
        </span>
        <span className="flex items-center gap-3">
          −{formatMoney(applied, giftCard.currency)}
          <button className="text-xs text-ash underline" onClick={() => setGiftCard(null)}>Remove</button>
        </span>
      </div>
    );
  }
  return (
    <details className="py-2">
      <summary className="text-[12px] underline underline-offset-4">Have a gift card?</summary>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(code)}`);
          const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; balance?: number; currency?: string };
          setBusy(false);
          if (!res.ok || !data.code) return setError(data.error ?? "Invalid code.");
          setGiftCard({ code: data.code, balance: data.balance!, currency: data.currency! });
        }}
      >
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OOLU-XXXX-XXXX-XXXX" className="input py-2.5 font-mono text-sm uppercase" aria-label="Gift card code" />
        <button className="btn-solid shrink-0 px-4 py-2.5" disabled={busy || !code.trim()}>{busy ? "…" : "Apply"}</button>
      </form>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <p className="mt-2 text-[11px] text-ash">Discount codes can be added at checkout.</p>
    </details>
  );
}

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const left = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="py-4">
      <p className="text-xs">
        {left > 0 ? (
          <>
            You&apos;re <strong>{formatMoney(left)}</strong> away from free shipping
          </>
        ) : (
          <>You&apos;ve unlocked free shipping</>
        )}
      </p>
      <div className="mt-2 h-[3px] bg-black/10">
        <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { lines, open, setOpen } = useCart();
  const { checkout, pending, error } = useCheckout();
  const subtotal = cartSubtotal(lines);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <div className={open ? "" : "pointer-events-none"} aria-hidden={!open}>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <h2 className="label text-xs font-semibold">Your bag</h2>
          <button aria-label="Close bag" onClick={() => setOpen(false)}>
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-sm text-ash">Your bag is empty.</p>
            <Link href="/shop" className="btn-solid" onClick={() => setOpen(false)}>
              Shop now
            </Link>
          </div>
        ) : (
          <>
            <div className="px-6">
              <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <ul className="flex-1 divide-y divide-black/10 overflow-y-auto px-6">
              {lines.map((l) => (
                <CartLineRow key={`${l.productId}|${l.size}`} line={l} compact />
              ))}
            </ul>
            <div className="border-t border-black/10 px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="label">Subtotal</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <GiftCardInput subtotal={subtotal} />
              <p className="mt-1 text-xs text-ash">Shipping and taxes calculated at checkout.</p>
              {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
              <button className="btn-solid mt-4 w-full py-4" onClick={checkout} disabled={pending}>
                {pending ? "Redirecting…" : "Checkout"}
              </button>
              <Link
                href="/cart"
                className="mt-3 block text-center text-[11px] tracking-[0.14em] uppercase underline-offset-4 hover:underline"
                onClick={() => setOpen(false)}
              >
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
