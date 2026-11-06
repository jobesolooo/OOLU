"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, register, type FormState } from "./actions";

export function PasswordInput({ name = "password", autoComplete, placeholder }: { name?: string; autoComplete: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} placeholder={placeholder} className="input py-[clamp(10px,1.4vh,16px)] pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-ash hover:text-ink"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  // Controlled so a validation error doesn't wipe what was typed.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="space-y-[clamp(12px,2vh,24px)]">
      {next && <input type="hidden" name="next" value={next} />}
      <div className={mode === "register" ? "grid gap-[clamp(12px,2vh,24px)] sm:grid-cols-2 sm:gap-3" : ""}>
        {mode === "register" && (
          <label className="block">
            <span className="label mb-2 block text-[12px]">Name</span>
            <input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="input py-[clamp(10px,1.4vh,16px)]" />
          </label>
        )}
        <label className="block">
          <span className="label mb-2 block text-[12px]">Email</span>
          <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input py-[clamp(10px,1.4vh,16px)]" />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 flex items-center justify-between">
          <span className="label text-[12px]">Password</span>
          {mode === "login" && (
            <Link href="/account/forgot" className="text-[13px] underline underline-offset-4">
              Forgot password?
            </Link>
          )}
        </span>
        <PasswordInput
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? "8+ characters, letters and numbers" : undefined}
        />
      </label>
      {mode === "register" && (
        <label className="flex items-start gap-3 text-[13px] leading-snug text-black/75">
          <input type="checkbox" name="newsletter" className="mt-1" />
          <span>Email me drops, restocks and offers.</span>
        </label>
      )}
      {state?.error && <p className="text-[13px] text-red-700" role="alert">{state.error}</p>}
      <button className="btn-solid h-[clamp(52px,7vh,62px)] w-full text-[13px]" disabled={pending}>
        {pending ? "One sec…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-[13px] leading-relaxed text-ash">
        {mode === "login" ? (
          <>New here? <Link className="text-ink underline" href={`/account/register${q}`}>Create an account</Link></>
        ) : (
          <>
            Already have an account? <Link className="text-ink underline" href={`/account/login${q}`}>Sign in</Link>
            <span className="block text-xs">
              By joining you agree to our <Link href="/legal/terms" className="underline">terms</Link> and{" "}
              <Link href="/legal/privacy" className="underline">privacy policy</Link>.
            </span>
          </>
        )}
      </p>
    </form>
  );
}
