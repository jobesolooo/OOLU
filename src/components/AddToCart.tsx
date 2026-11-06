"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, MAX_QTY } from "@/store/cart";
import { cx } from "@/lib/format";
import { NotifyMe } from "./NotifyMe";
import { SizeGuide, type SizeChart } from "./product/SizeGuide";
import { WishlistButton } from "./WishlistButton";
import type { SavedProduct } from "@/store/saved";

type Props = {
  product: SavedProduct & { sizes: string[]; upcoming: boolean };
  /** size → units left; missing = not tracked (unlimited) */
  stock: Record<string, number>;
  sizeChart?: SizeChart | null;
};

export function AddToCart({ product, stock, sizeChart }: Props) {
  const add = useCart((s) => s.add);
  const oneSize = product.sizes.length === 1;
  const isOut = (s: string) => stock[s] !== undefined && stock[s] <= 0;
  const firstAvailable = product.sizes.find((s) => !isOut(s)) ?? null;
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const left = size ? stock[size] : undefined;
  const maxQty = Math.min(MAX_QTY, left ?? MAX_QTY);
  const soldOut = firstAvailable === null;
  const sizeOut = size ? isOut(size) : false;

  if (product.upcoming) {
    return (
      <div className="space-y-4">
        <NotifyMe productId={product.id} size="" label="Get an email the moment it drops" />
        <WishlistButton product={product} label className="border border-black/20 px-5 py-3.5 hover:border-ink" />
      </div>
    );
  }

  function onAdd() {
    if (!size) {
      setError("Pick a size first.");
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitAmount: product.unitAmount,
      currency: product.currency,
      size,
      quantity: Math.min(qty, maxQty),
    });
    setError(null);
  }

  return (
    <div className="space-y-6">
      {!oneSize && (
        <fieldset>
          <div className="mb-3 flex items-center justify-between">
            <legend className="label font-semibold">Size{size ? `: ${size}` : ""}</legend>
            {sizeChart && <SizeGuide chart={sizeChart} productName={product.name} />}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((s) => {
              const out = isOut(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                    setError(null);
                  }}
                  aria-pressed={size === s}
                  aria-label={out ? `${s}, sold out — get notified` : s}
                  className={cx(
                    "border py-3.5 text-[13px] font-medium transition-colors",
                    size === s ? "border-ink bg-ink text-white" : "border-black/20 hover:border-ink",
                    out && size !== s && "text-black/35 line-through",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {left !== undefined && left > 0 && left <= 5 && <p className="mt-3 text-[13px] text-[#a3271b]">Only {left} left in this size</p>}
        </fieldset>
      )}

      {sizeOut || (oneSize && soldOut) ? (
        <NotifyMe productId={product.id} size={size ?? ""} label={`${oneSize ? "Sold out" : `Size ${size} is sold out`} — get notified when it's back`} />
      ) : (
        <div className="flex gap-3">
          <div className="flex items-center border border-black/20">
            <button type="button" aria-label="Decrease quantity" className="grid size-12 place-items-center sm:size-14" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="grid size-12 place-items-center disabled:opacity-30 sm:size-14"
              disabled={qty >= maxQty}
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button type="button" className="btn-solid flex-1 px-4 py-[18px] text-[13px] whitespace-nowrap" onClick={onAdd}>
            Add to bag
          </button>
          <WishlistButton product={product} className="grid w-12 shrink-0 place-items-center border sm:w-14 border-black/20 hover:border-ink" />
        </div>
      )}
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
