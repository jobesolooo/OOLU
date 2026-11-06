"use client";

import { useActionState } from "react";
import { BadgeCheck } from "lucide-react";
import { changePassword, deleteAccount, updateProfile, type FormState } from "../actions";
import { PasswordInput } from "../AuthForm";

function Msg({ state }: { state: FormState }) {
  if (!state) return null;
  return <p className={`text-[13px] ${state.error ? "text-red-700" : "text-emerald-700"}`} role="status">{state.error ?? state.ok}</p>;
}

export function ProfileForm({ name, email, verified }: { name: string; email: string; verified: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label mb-2 block text-[11px]">Name</span>
        <input name="name" defaultValue={name} required maxLength={80} autoComplete="name" className="input" />
      </label>
      <div>
        <span className="label mb-2 block text-[11px]">Email</span>
        <p className="flex items-center gap-2 text-[15px]">
          {email}
          {verified ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck className="size-4" /> Confirmed</span>
          ) : (
            <span className="text-xs text-amber-700">Not confirmed</span>
          )}
        </p>
      </div>
      <Msg state={state} />
      <button className="btn-solid" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      {hasPassword && <PasswordInput name="current" autoComplete="current-password" placeholder="Current password" />}
      <PasswordInput autoComplete="new-password" placeholder="New password" />
      <PasswordInput name="confirm" autoComplete="new-password" placeholder="Repeat new password" />
      <Msg state={state} />
      <button className="btn-solid" disabled={pending}>{pending ? "Saving…" : hasPassword ? "Change password" : "Add password"}</button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-black/75">
        Removes your profile, wishlist and sign-in methods, and unsubscribes you. Past orders are kept anonymously for tax records. This can&apos;t be undone.
      </p>
      <input name="confirmDelete" placeholder='Type "DELETE" to confirm' autoComplete="off" className="input" />
      <Msg state={state} />
      <button className="border border-rose-800 px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-rose-800 uppercase hover:bg-rose-800 hover:text-white" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
