"use client";

import { useT, useTx } from "@/components/Prefs";
import { useActionState } from "react";
import { changePassword, deleteAccount, type FormState } from "../actions";
import { Field } from "../forms";
import { PasswordInput } from "../AuthForm";

function Msg({ state }: { state: FormState }) {
  const tx = useTx();
  if (!state) return null;
  return <p className={`text-[13px] ${state.error ? "text-red-700" : "text-emerald-700"}`} role="status">{tx(state.error ?? state.ok)}</p>;
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-5 sm:grid-cols-2">
      {hasPassword && (
        <Field label={t("auth.currentPw")} className="sm:col-span-2 sm:max-w-[calc(50%-8px)]">
          <PasswordInput name="current" autoComplete="current-password" />
        </Field>
      )}
      <Field label={t("auth.newPw")}>
        <PasswordInput autoComplete="new-password" />
      </Field>
      <Field label={t("auth.repeatPw")}>
        <PasswordInput name="confirm" autoComplete="new-password" />
      </Field>
      <div className="space-y-3 sm:col-span-2">
        <Msg state={state} />
        <button className="btn-solid" disabled={pending}>{pending ? t("auth.saving") : hasPassword ? t("set.changePw") : t("set.addPw")}</button>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-black/75">
        {t("set.deleteBody")}
      </p>
      <input name="confirmDelete" placeholder={t("set.typeDelete")} autoComplete="off" className="input" />
      <Msg state={state} />
      <button className="border border-rose-800 px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-rose-800 uppercase hover:bg-rose-800 hover:text-white" disabled={pending}>
        {pending ? t("set.deleting") : t("set.deleteMine")}
      </button>
    </form>
  );
}
