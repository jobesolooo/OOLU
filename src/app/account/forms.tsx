"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { useT, useTx } from "@/components/Prefs";
import { cx } from "@/lib/format";
import type { FormState } from "./actions";
import { requestEmailChange, saveAddressAction, saveProfile, updateMyReview } from "./manage";
import { PasswordInput } from "./AuthForm";

export function FormMsg({ state }: { state: FormState }) {
  const tx = useTx();
  if (!state) return null;
  return (
    <p className={cx("text-[13px]", state.error ? "text-red-700" : "text-emerald-700")} role="status">
      {tx(state.error ?? state.ok)}
    </p>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block min-w-0", className)}>
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.1em] uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ash">{hint}</span>}
    </label>
  );
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

/* ── Personal details ── */
export function DetailsForm({
  user,
}: {
  user: { name: string | null; phone: string | null; birthday: string | null; sizeTop: string | null; sizeBottom: string | null };
}) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, undefined);
  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      <Field label={t("auth.name")} className="sm:col-span-2">
        <input name="name" defaultValue={user.name ?? ""} required maxLength={80} autoComplete="name" className="input" />
      </Field>
      <Field label={t("ac.phone")} hint={t("ac.phoneHint")}>
        <input name="phone" type="tel" defaultValue={user.phone ?? ""} maxLength={30} autoComplete="tel" placeholder="+31 6 12345678" className="input" />
      </Field>
      <Field label={t("ac.birthday")} hint={t("ac.birthdayHint")}>
        <input name="birthday" type="date" defaultValue={user.birthday ?? ""} max={new Date().toISOString().slice(0, 10)} className="input" />
      </Field>
      <Field label={t("ac.sizeTop")}>
        <select name="sizeTop" defaultValue={user.sizeTop ?? ""} className="input">
          <option value="">{t("ac.noSize")}</option>
          {SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label={t("ac.sizeBottom")}>
        <select name="sizeBottom" defaultValue={user.sizeBottom ?? ""} className="input">
          <option value="">{t("ac.noSize")}</option>
          {SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button className="btn-solid" disabled={pending}>
          {pending ? t("auth.saving") : t("set.save")}
        </button>
        <FormMsg state={state} />
      </div>
    </form>
  );
}

/* ── Change email ── */
export function EmailForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(requestEmailChange, undefined);
  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      <Field label={t("ac.newEmail")}>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      {hasPassword && (
        <Field label={t("ac.yourPassword")}>
          <PasswordInput name="password" autoComplete="current-password" placeholder={t("auth.currentPw")} />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button className="btn-solid" disabled={pending}>
          {pending ? t("auth.saving") : t("ac.sendLink")}
        </button>
        <FormMsg state={state} />
      </div>
    </form>
  );
}

/* ── Address ── */
export type AddressDraft = {
  id?: string;
  label?: string | null;
  name?: string | null;
  line1?: string;
  line2?: string | null;
  postalCode?: string;
  city?: string;
  region?: string | null;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
};

export function AddressForm({ address, countries, firstOne }: { address: AddressDraft; countries: { code: string; name: string }[]; firstOne: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(saveAddressAction, undefined);
  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      {address.id && <input type="hidden" name="id" value={address.id} />}
      <Field label={t("ac.addrLabel")} hint={t("ac.addrLabelHint")}>
        <input name="label" defaultValue={address.label ?? ""} maxLength={40} placeholder={t("ac.addrLabelPh")} className="input" />
      </Field>
      <Field label={t("ac.recipient")}>
        <input name="name" defaultValue={address.name ?? ""} required maxLength={80} autoComplete="name" className="input" />
      </Field>
      <Field label={t("ac.line1")} className="sm:col-span-2">
        <input name="line1" defaultValue={address.line1 ?? ""} required maxLength={120} autoComplete="address-line1" className="input" />
      </Field>
      <Field label={t("ac.line2")} className="sm:col-span-2">
        <input name="line2" defaultValue={address.line2 ?? ""} maxLength={120} autoComplete="address-line2" className="input" />
      </Field>
      <Field label={t("ac.postcode")}>
        <input name="postalCode" defaultValue={address.postalCode ?? ""} required maxLength={20} autoComplete="postal-code" className="input" />
      </Field>
      <Field label={t("ac.city")}>
        <input name="city" defaultValue={address.city ?? ""} required maxLength={80} autoComplete="address-level2" className="input" />
      </Field>
      <Field label={t("ac.region")}>
        <input name="region" defaultValue={address.region ?? ""} maxLength={80} autoComplete="address-level1" className="input" />
      </Field>
      <Field label={t("ac.country")}>
        <select name="country" defaultValue={address.country ?? "NL"} required autoComplete="country" className="input">
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("ac.phone")} hint={t("ac.addrPhoneHint")}>
        <input name="phone" type="tel" defaultValue={address.phone ?? ""} maxLength={30} autoComplete="tel" className="input" />
      </Field>
      {!firstOne && (
        <label className="flex items-center gap-2.5 self-end pb-3 text-[13px]">
          <input type="checkbox" name="isDefault" defaultChecked={address.isDefault} className="size-[18px] accent-ink" />
          {t("ac.makeDefault")}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button className="btn-solid" disabled={pending}>
          {pending ? t("auth.saving") : address.id ? t("ac.saveAddress") : t("ac.addAddress")}
        </button>
        <Link href="/account/addresses" className="text-[11px] tracking-[0.08em] uppercase underline underline-offset-4">
          {t("ac.cancel")}
        </Link>
        <FormMsg state={state} />
      </div>
    </form>
  );
}

/* ── Edit a review ── */
export function ReviewForm({ review }: { review: { id: string; rating: number; title: string | null; body: string; fit: string | null } }) {
  const t = useT();
  const [rating, setRating] = useState(review.rating);
  const [state, action, pending] = useActionState<FormState, FormData>(updateMyReview, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={review.id} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <span className="mb-2 block text-[11px] font-semibold tracking-[0.1em] uppercase">{t("ac.rating")}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t("ac.rating")}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}/5`}
              onClick={() => setRating(n)}
              className="grid size-10 place-items-center"
            >
              <Star className={cx("size-6", n <= rating ? "fill-ink text-ink" : "text-black/25")} strokeWidth={1.3} />
            </button>
          ))}
        </div>
      </div>
      <Field label={t("ac.reviewTitle")}>
        <input name="title" defaultValue={review.title ?? ""} maxLength={120} className="input" />
      </Field>
      <Field label={t("ac.reviewBody")}>
        <textarea name="body" defaultValue={review.body} required minLength={10} maxLength={3000} rows={5} className="input" />
      </Field>
      <Field label={t("ac.fit")}>
        <select name="fit" defaultValue={review.fit ?? ""} className="input">
          <option value="">—</option>
          <option value="small">{t("ac.fitSmall")}</option>
          <option value="true">{t("ac.fitTrue")}</option>
          <option value="large">{t("ac.fitLarge")}</option>
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn-solid" disabled={pending}>
          {pending ? t("auth.saving") : t("ac.saveReview")}
        </button>
        <Link href="/account/reviews" className="text-[11px] tracking-[0.08em] uppercase underline underline-offset-4">
          {t("ac.cancel")}
        </Link>
        <FormMsg state={state} />
      </div>
    </form>
  );
}
