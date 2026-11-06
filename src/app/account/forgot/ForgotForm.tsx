"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-6">
        <p className="bg-white p-5 text-[15px]">{state.ok}</p>
        <Link href="/account/login" className="text-sm underline underline-offset-4">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input name="email" type="email" required autoComplete="email" placeholder="Email" className="input" />
      {state?.error && <p className="text-[13px] text-red-700" role="alert">{state.error}</p>}
      <button className="btn-solid w-full py-[18px]" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
      <p className="text-center text-[13px]"><Link href="/account/login" className="underline underline-offset-4">Back to sign in</Link></p>
    </form>
  );
}
