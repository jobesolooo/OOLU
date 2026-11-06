"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, MAX_QTY } from "@/store/cart";
import { cx } from "@/lib/format";
import { variantKey, variantLabel, type ColorOption } from "@/lib/variants";
import { NotifyMe } from "./NotifyMe";
import { SizeGuide, type SizeChart } from "./product/SizeGuide";
import { WishlistButton } from "./WishlistButton";
import type { SavedProduct } from "@/store/saved";

type Props = {
  product: SavedProduct & { sizes: string[]; colors: ColorOption[]; variants: string[]; upcoming: boolean };
  /** variant key → units left; missing = not tracked (unlimited) */
  stock: Record<string, number>;
  sizeChart?: SizeChart | null;
};

export function AddToCart({ product, stock, sizeChart }: Props) {
  const add = useCart((s) => s.add);
  const hasColors = product.colors.length > 0;
  const oneSize = product.sizes.length === 1;
  const exists = (k: string) => product.variants.includes(k);
  const isOut = (k: string) => !exists(k) || (stock[k] !== undefined && stock[k] <= 0);
  const colorOut = (c: string) => product.sizes.every((s) => isOut(variantKey(s, c)));

  const [color, setColor] = useState<string | null>(hasColors ? (product.colors.find((c) => !colorOut(c.name))?.name ?? product.colors[0].name) : null);
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const key = size ? variantKey(size, color) : null;
  const left = key ? stock[key] : undefined;
  const maxQty = Math.min(MAX_QTY, left ?? MAX_QTY);
  const keyOut = key ? isOut(key) : false;
  const everythingOut = product.variants.every(isOut);

  if (product.upcoming) {
    return (
      <div className="space-y-4">
        <NotifyMe productId={product.id} size="" label="Get an email the moment it drops" />
        <WishlistButton product={product} label className="border border-black/20 px-5 py-3.5 hover:border-ink" />
      </div>
    );
  }

  function onAdd() {
    if (hasColors && !color) return setError("Pick a colour first.");
    if (!size || !key) return setError("Pick a size first.");
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitAmount: product.unitAmount,
      currency: product.currency,
      size: key,
      quantity: Math.min(qty, maxQty),
    });
    setError(null);
  }

  return (
    <div className="space-y-7">
      {hasColors && (
        <fieldset>
          <legend className="label mb-3 font-semibold">Colour: <span className="font-normal normal-case">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const out = colorOut(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={color === c.name}
                  aria-label={out ? `${c.name}, sold out` : c.name}
                  onClick={() => {
                    setColor(c.name);
                    setQty(1);
                    setError(null);
                  }}
                  className={cx(
                    "flex items-center gap-2 border py-2 pr-3.5 pl-2 text-[13px] transition-colors",
                    color === c.name ? "border-ink" : "border-black/15 hover:border-ink",
                    out && "text-black/40",
                  )}
                >
                  <span className="size-5 rounded-full border border-black/15" style={{ background: c.hex }} />
                  <span className={out ? "line-through" : undefined}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!oneSize && (
        <fieldset>
          <div className="mb-3 flex items-center justify-between">
            <legend className="label font-semibold">Size{size ? `: ${size}` : ""}</legend>
            {sizeChart && <SizeGuide chart={sizeChart} productName={product.name} />}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((s) => {
              const k = variantKey(s, color);
              const out = isOut(k);
              const missing = !exists(k);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={missing}
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                    setError(null);
                  }}
                  aria-pressed={size === s}
                  aria-label={missing ? `${s}, not made in this colour` : out ? `${s}, sold out — get notified` : s}
                  className={cx(
                    "border py-3.5 text-[13px] font-medium transition-colors",
                    size === s ? "border-ink bg-ink text-white" : "border-black/20 hover:border-ink",
                    out && size !== s && "text-black/35 line-through",
                    missing && "cursor-not-allowed opacity-40 hover:border-black/20",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {left !== undefined && left > 0 && left <= 5 && <p className="mt-3 text-[13px] text-[#a3271b]">Only {left} left</p>}
        </fieldset>
      )}

      {(key && keyOut) || (oneSize && !hasColors && everythingOut) ? (
        <NotifyMe
          productId={product.id}
          size={key ?? ""}
          label={`${key && !oneSize ? `${variantLabel(key)} is sold out` : "Sold out"} — get notified when it's back`}
        />
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
          <button type="button" className="btn-solid flex-1 px-4 py-[18px] text-[13px] whitespace-nowrap" onClick={onAdd} disabled={everythingOut}>
            {everythingOut ? "Sold out" : "Add to bag"}
          </button>
          <WishlistButton product={product} className="grid w-12 shrink-0 place-items-center border border-black/20 hover:border-ink sm:w-14" />
        </div>
      )}
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
