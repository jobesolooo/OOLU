"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" && (
        <label className="block">
          <span className="label mb-2 block text-[10px]">Name</span>
          <input name="name" required autoComplete="name" className="input" />
        </label>
      )}
      <label className="block">
        <span className="label mb-2 block text-[10px]">Email</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="block">
        <span className="label mb-2 block text-[10px]">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="input"
        />
      </label>
      {state?.error && <p className="text-xs text-red-700" role="alert">{state.error}</p>}
      <button className="btn-solid w-full py-4" disabled={pending}>
        {pending ? "One sec…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-xs text-ash">
        {mode === "login" ? (
          <>New here? <Link className="text-ink underline" href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link></>
        ) : (
          <>Already have an account? <Link className="text-ink underline" href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in</Link></>
        )}
      </p>
    </form>
  );
}
