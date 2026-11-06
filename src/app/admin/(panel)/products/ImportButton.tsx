"use client";

import { useActionState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { importCatalogue, type ProductFormState } from "./actions";

/** Copies the built-in catalogue (with photos) into Stripe. */
export function ImportButton({ count }: { count: number }) {
  const [state, run, pending] = useActionState<ProductFormState>(importCatalogue, undefined);
  return (
    <form action={run} className="flex flex-col items-start gap-2">
      <button className="btn-solid gap-2" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" strokeWidth={1.5} />}
        {pending ? "Copying photos and products…" : `Copy catalogue to Stripe (${count})`}
      </button>
      {state?.error && <p className="text-[12px] text-rose-700">{state.error}</p>}
      {state?.ok && <p className="text-[12px] text-emerald-700">{state.ok}</p>}
    </form>
  );
}
