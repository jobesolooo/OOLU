"use client";

import { useT, useTx } from "@/components/Prefs";
import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type FormState } from "../actions";
import { PasswordInput } from "../AuthForm";

export function ResetForm({ token }: { token: string }) {
  const t = useT();
  const tx = useTx();
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordInput autoComplete="new-password" placeholder={t("auth.newPw")} />
      <PasswordInput name="confirm" autoComplete="new-password" placeholder={t("auth.repeatPw")} />
      <p className="text-xs text-ash">{t("auth.pwRules")}</p>
      {state?.error && (
        <p className="text-[13px] text-red-700" role="alert">
          {tx(state.error)} {state.error.includes("expired") && <Link href="/account/forgot" className="underline">{t("auth.requestNewLink")}</Link>}
        </p>
      )}
      <button className="btn-solid w-full py-[18px]" disabled={pending}>{pending ? t("auth.saving") : t("auth.savePw")}</button>
    </form>
  );
}
