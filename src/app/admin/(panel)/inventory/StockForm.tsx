"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { cx } from "@/lib/format";
import { saveInventory } from "../actions";

const LOW = 3;

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const bySize = (a: { size: string }, b: { size: string }) => {
  const i = SIZE_ORDER.indexOf(a.size.toUpperCase());
  const j = SIZE_ORDER.indexOf(b.size.toUpperCase());
  return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
};

type Row = { color: { name: string; hex: string } | null; keys: { key: string; size: string }[] };

/** Splits "Colour / Size" keys into one row per colour (or a single row of sizes). */
function rows(keys: string[], colors: { name: string; hex: string }[]): Row[] {
  if (!keys.some((k) => k.includes(" / "))) return [{ color: null, keys: keys.map((k) => ({ key: k, size: k === "One Size" ? "Qty" : k })).sort(bySize) }];
  const out = new Map<string, Row>();
  for (const k of keys) {
    const [name, size] = k.split(" / ");
    if (!out.has(name)) out.set(name, { color: colors.find((c) => c.name === name) ?? { name, hex: "#cccccc" }, keys: [] });
    out.get(name)!.keys.push({ key: k, size });
  }
  return [...out.values()].map((r) => ({ ...r, keys: r.keys.sort(bySize) }));
}

/** Per-size stock editor. Empty box = not tracked (∞). */
export function StockForm({
  productId,
  sizes,
  colors,
  stock,
}: {
  productId: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: Record<string, number>;
}) {
  const [state, action, pending] = useActionState(saveInventory, undefined);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(sizes.map((s) => [s, stock[s] === undefined ? "" : String(stock[s])])));
  const dirty = sizes.some((s) => values[s] !== (stock[s] === undefined ? "" : String(stock[s])));
  const step = (k: string, d: number) =>
    setValues((v) => ({ ...v, [k]: String(Math.max(0, (Number(v[k]) || 0) + d)) }));

  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="productId" value={productId} />
      <div className="space-y-3">
        {rows(sizes, colors).map((row) => (
          <div key={row.color?.name ?? "sizes"} className="flex flex-wrap items-end gap-x-2 gap-y-3">
            {row.color && (
              <span className="flex w-full items-center gap-2 text-[11px] font-medium sm:w-28 sm:pb-2.5">
                <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: row.color.hex }} />
                <span className="truncate">{row.color.name}</span>
              </span>
            )}
            {row.keys.map(({ key, size }) => {
              const v = values[key];
              const n = v === "" ? null : Number(v);
              const tone = n === null ? "border-black/10 bg-mist/60" : n === 0 ? "border-rose-300 bg-rose-50" : n <= LOW ? "border-amber-300 bg-amber-50" : "border-black/15 bg-white";
              return (
                <label key={key} className="w-[92px]">
                  <span className="mb-1 block truncate text-center text-[10px] font-semibold tracking-[0.1em] text-ash uppercase" title={key}>
                    {size}
                  </span>
                  <span className={cx("flex h-10 items-stretch border transition-colors focus-within:border-ink", tone)}>
                    <button type="button" tabIndex={-1} onClick={() => step(key, -1)} aria-label={`One less ${key}`} className="grid w-6 place-items-center text-ash hover:text-ink">
                      <Minus className="size-3" />
                    </button>
                    <input
                      name={`size:${key}`}
                      value={v}
                      onChange={(e) => setValues((s) => ({ ...s, [key]: e.target.value.replace(/[^\d]/g, "") }))}
                      placeholder="∞"
                      inputMode="numeric"
                      aria-label={`Stock for ${key}`}
                      className="w-full min-w-0 bg-transparent text-center text-[13px] tabular-nums focus:outline-none"
                    />
                    <button type="button" tabIndex={-1} onClick={() => step(key, 1)} aria-label={`One more ${key}`} className="grid w-6 place-items-center text-ash hover:text-ink">
                      <Plus className="size-3" />
                    </button>
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className={cx("btn-solid gap-2 px-5 py-2.5", !dirty && !pending && "opacity-40")} disabled={pending || !dirty}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {pending ? "Saving" : "Save"}
        </button>
        {dirty && !pending && (
          <button
            type="button"
            onClick={() => setValues(Object.fromEntries(sizes.map((s) => [s, stock[s] === undefined ? "" : String(stock[s])])))}
            className="text-[11px] text-ash underline hover:text-ink"
          >
            Undo
          </button>
        )}
        {state && !dirty && (
          <span className={cx("flex items-center gap-1 text-[12px]", state.error ? "text-rose-700" : "text-emerald-700")}>
            {!state.error && <Check className="size-3.5" />}
            {state.error ?? state.ok}
          </span>
        )}
        {state?.error && dirty && <span className="text-[12px] text-rose-700">{state.error}</span>}
      </div>
    </form>
  );
}
