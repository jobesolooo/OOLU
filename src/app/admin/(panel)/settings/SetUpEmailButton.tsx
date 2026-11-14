"use client";

import { useActionState, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { setUpEmailAction } from "./business-actions";

export function SetUpEmailButton({ again, unlockedUntil }: { again: boolean; unlockedUntil: number | null }) {
  const [state, run, pending] = useActionState(setUpEmailAction, undefined);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const locked = !unlockedUntil || unlockedUntil <= now;
  return (
    <form action={run} className="flex max-w-sm flex-col items-end gap-1.5">
      <button disabled={pending || locked} className="btn-solid !px-5 !py-3">
        <Mail className="size-4" /> {pending ? "Setting up…" : again ? "Check & repair" : "Set up email"}
      </button>
      {locked && !state && (
        <a href="#security" className="text-right text-[11px] text-ash underline">
          Unlock with the passcode at the top first
        </a>
      )}
      {state && (
        <span role="status" className={`text-right text-xs ${state.error ? "text-red-700" : "text-emerald-700"}`}>
          {state.error ?? state.ok}
        </span>
      )}
    </form>
  );
}
