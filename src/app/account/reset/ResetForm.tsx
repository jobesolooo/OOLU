"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type FormState } from "../actions";
import { PasswordInput } from "../AuthForm";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordInput autoComplete="new-password" placeholder="New password" />
      <PasswordInput name="confirm" autoComplete="new-password" placeholder="Repeat new password" />
      <p className="text-xs text-ash">At least 8 characters, with letters and numbers. You&apos;ll be signed out on other devices.</p>
      {state?.error && (
        <p className="text-[13px] text-red-700" role="alert">
          {state.error} {state.error.includes("expired") && <Link href="/account/forgot" className="underline">Request a new link</Link>}
        </p>
      )}
      <button className="btn-solid w-full py-[18px]" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
