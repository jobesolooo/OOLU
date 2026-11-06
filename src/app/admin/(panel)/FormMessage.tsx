"use client";

import { useActionState } from "react";
import type { ActionResult } from "./actions";

/** Generic admin form wrapper: runs a server action and shows its ok/error message. */
export function AdminForm({
  action,
  children,
  className,
  submitLabel = "Save",
  confirmText,
}: {
  action: (s: ActionResult, f: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  confirmText?: string;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form
      action={run}
      className={className}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button className="btn-solid" disabled={pending}>{pending ? "Working…" : submitLabel}</button>
        {state && <span className={`text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.ok}</span>}
      </div>
    </form>
  );
}
