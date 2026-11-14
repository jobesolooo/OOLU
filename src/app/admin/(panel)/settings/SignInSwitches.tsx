"use client";

import { useActionState, useRef } from "react";
import { saveSignInButtons } from "./staff-actions";
import { cx } from "@/lib/format";

type Row = { id: "google" | "apple"; label: string; on: boolean; ready: boolean };

/** Two switches that save as soon as they're flipped. */
export function SignInSwitches({ rows }: { rows: Row[] }) {
  const [state, run, pending] = useActionState(saveSignInButtons, undefined);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={run} className="space-y-3">
      {rows.map((r) => (
        <label key={r.id} className="flex cursor-pointer items-start justify-between gap-4 border-t border-black/5 pt-3 first:border-t-0 first:pt-0">
          <span className="min-w-0">
            <span className="block text-[13px] font-medium">Continue with {r.label}</span>
            <span className={cx("block text-[12px]", !r.ready ? "text-amber-700" : r.on ? "text-emerald-700" : "text-ash")}>
              {!r.ready
                ? `Hidden until its keys are added under Account keys → ${r.label}.`
                : r.on
                  ? "Shown on the sign-in and sign-up pages."
                  : "Hidden from customers. Accounts already connected keep working."}
            </span>
          </span>
          <span className="relative mt-0.5 inline-flex shrink-0">
            <input
              type="checkbox"
              name={r.id}
              defaultChecked={r.on}
              disabled={pending}
              onChange={() => form.current?.requestSubmit()}
              className="peer sr-only"
              aria-label={`Show Continue with ${r.label} on the store`}
            />
            <span className="h-6 w-11 rounded-full bg-black/15 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-disabled:opacity-60" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      ))}
      {state && <p className={`text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}
