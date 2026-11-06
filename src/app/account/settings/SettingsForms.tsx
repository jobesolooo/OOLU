"use client";

import { useT, useTx } from "@/components/Prefs";
import { useActionState } from "react";
import { BadgeCheck } from "lucide-react";
import { changePassword, deleteAccount, updateProfile, type FormState } from "../actions";
import { PasswordInput } from "../AuthForm";

function Msg({ state }: { state: FormState }) {
  const tx = useTx();
  if (!state) return null;
  return <p className={`text-[13px] ${state.error ? "text-red-700" : "text-emerald-700"}`} role="status">{tx(state.error ?? state.ok)}</p>;
}

export function ProfileForm({ name, email, verified }: { name: string; email: string; verified: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label mb-2 block text-[11px]">{t("auth.name")}</span>
        <input name="name" defaultValue={name} required maxLength={80} autoComplete="name" className="input" />
      </label>
      <div>
        <span className="label mb-2 block text-[11px]">{t("auth.email")}</span>
        <p className="flex items-center gap-2 text-[15px]">
          {email}
          {verified ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck className="size-4" /> {t("set.confirmed")}</span>
          ) : (
            <span className="text-xs text-amber-700">{t("set.notConfirmed")}</span>
          )}
        </p>
      </div>
      <Msg state={state} />
      <button className="btn-solid" disabled={pending}>{pending ? t("auth.saving") : t("set.save")}</button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      {hasPassword && <PasswordInput name="current" autoComplete="current-password" placeholder={t("auth.currentPw")} />}
      <PasswordInput autoComplete="new-password" placeholder={t("auth.newPw")} />
      <PasswordInput name="confirm" autoComplete="new-password" placeholder={t("auth.repeatPw")} />
      <Msg state={state} />
      <button className="btn-solid" disabled={pending}>{pending ? t("auth.saving") : hasPassword ? t("set.changePw") : t("set.addPw")}</button>
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
