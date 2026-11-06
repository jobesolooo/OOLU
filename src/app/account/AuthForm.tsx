"use client";

import { useT, useTx } from "@/components/Prefs";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, register, type FormState } from "./actions";

export function PasswordInput({ name = "password", autoComplete, placeholder }: { name?: string; autoComplete: string; placeholder?: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} placeholder={placeholder} className="input py-[clamp(10px,1.4vh,16px)] pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t("auth.hidePw") : t("auth.showPw")}
        className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-ash hover:text-ink"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const t = useT();
  const tx = useTx();
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
            <span className="label mb-2 block text-[12px]">{t("auth.name")}</span>
            <input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="input py-[clamp(10px,1.4vh,16px)]" />
          </label>
        )}
        <label className="block">
          <span className="label mb-2 block text-[12px]">{t("auth.email")}</span>
          <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input py-[clamp(10px,1.4vh,16px)]" />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 flex items-center justify-between">
          <span className="label text-[12px]">{t("auth.password")}</span>
          {mode === "login" && (
            <Link href="/account/forgot" className="text-[13px] underline underline-offset-4">
              {t("auth.forgot")}
            </Link>
          )}
        </span>
        <PasswordInput
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? t("auth.pwHint") : undefined}
        />
      </label>
      {mode === "register" && (
        <label className="flex items-start gap-3 text-[13px] leading-snug text-black/75">
          <input type="checkbox" name="newsletter" className="mt-1" />
          <span>{t("auth.newsletterOptIn")}</span>
        </label>
      )}
      {state?.error && <p className="text-[13px] text-red-700" role="alert">{tx(state.error)}</p>}
      <button className="btn-solid h-[clamp(52px,7vh,62px)] w-full text-[13px]" disabled={pending}>
        {pending ? t("auth.oneSec") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
      </button>
      <p className="text-center text-[13px] leading-relaxed text-ash">
        {mode === "login" ? (
          <>{t("auth.newHere")} <Link className="text-ink underline" href={`/account/register${q}`}>{t("auth.createLink")}</Link></>
        ) : (
          <>
            {t("auth.haveAccount")} <Link className="text-ink underline" href={`/account/login${q}`}>{t("auth.signIn")}</Link>
            <span className="block text-xs">
              {t("auth.agree1")} <Link href="/legal/terms" className="underline">{t("auth.terms")}</Link> {t("auth.and")}{" "}
              <Link href="/legal/privacy" className="underline">{t("auth.privacy")}</Link>.
            </span>
          </>
        )}
      </p>
    </form>
  );
}
