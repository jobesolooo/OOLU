"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { setUpEmailAction } from "./business-actions";

export function SetUpEmailButton({ again }: { again: boolean }) {
  const [state, run, pending] = useActionState(setUpEmailAction, undefined);
  return (
    <form action={run} className="flex max-w-sm flex-col items-end gap-1.5">
      <button disabled={pending} className="btn-solid !px-5 !py-3">
        <Mail className="size-4" /> {pending ? "Setting up…" : again ? "Check & repair" : "Set up email"}
      </button>
      {state && (
        <span role="status" className={`text-right text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>
          {state.error ?? state.ok}
        </span>
      )}
    </form>
  );
}
