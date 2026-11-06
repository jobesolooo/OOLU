"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, MAX_QTY } from "@/store/cart";
import { cx } from "@/lib/format";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    unitAmount: number;
    currency: string;
    sizes: string[];
  };
  /** size → units left; missing = not tracked (unlimited) */
  stock: Record<string, number>;
};

export function AddToCart({ product, stock }: Props) {
  const add = useCart((s) => s.add);
  const oneSize = product.sizes.length === 1;
  const firstAvailable = product.sizes.find((s) => stock[s] === undefined || stock[s] > 0) ?? null;
  const [size, setSize] = useState<string | null>(oneSize ? firstAvailable : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const left = size ? stock[size] : undefined;
  const maxQty = Math.min(MAX_QTY, left ?? MAX_QTY);
  const soldOut = firstAvailable === null;

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
          <legend className="label mb-3 font-semibold">Size</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const out = stock[s] !== undefined && stock[s] <= 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                    setError(null);
                  }}
                  aria-pressed={size === s}
                  className={cx(
                    "min-w-12 border px-3 py-2.5 text-xs font-medium transition-colors",
                    size === s ? "border-ink bg-ink text-white" : "border-black/20 hover:border-ink",
                    out && "cursor-not-allowed text-black/30 line-through hover:border-black/20",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {left !== undefined && left > 0 && left <= 5 && <p className="mt-2 text-xs text-red-700">Only {left} left in this size</p>}
        </fieldset>
      )}

      <div className="flex gap-3">
        <div className="flex items-center border border-black/20">
          <button type="button" aria-label="Decrease quantity" className="grid size-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="grid size-12 place-items-center disabled:opacity-30"
            disabled={qty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <button type="button" className="btn-solid flex-1 py-4" onClick={onAdd} disabled={soldOut}>
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
