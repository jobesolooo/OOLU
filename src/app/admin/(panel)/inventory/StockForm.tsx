"use client";

import { useActionState } from "react";
import { saveInventory } from "../actions";

export function StockForm({ productId, sizes, stock }: { productId: string; sizes: string[]; stock: Record<string, number> }) {
  const [state, action, pending] = useActionState(saveInventory, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="productId" value={productId} />
      {sizes.map((s) => (
        <label key={s} className="w-16">
          <span className="mb-1 block text-[10px] text-ash">{s === "One Size" ? "Qty" : s}</span>
          <input
            name={`size:${s}`}
            defaultValue={stock[s] ?? ""}
            placeholder="∞"
            inputMode="numeric"
            className={`input px-2 py-2 text-center text-xs ${stock[s] === 0 ? "border-rose-400 bg-rose-50" : ""}`}
          />
        </label>
      ))}
      <button className="btn-solid px-4 py-2.5" disabled={pending}>{pending ? "…" : "Save"}</button>
      {state && <span className={`text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}
