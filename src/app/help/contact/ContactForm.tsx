"use client";

import { useActionState, useState } from "react";
import { sendContact, type ContactState } from "./actions";
import { useT, useTx } from "@/components/Prefs";
import type { MessageKey } from "@/i18n/messages";

const TOPICS = ["Order question", "Returns", "Product question", "Wholesale / collabs", "Press", "Other"];

export function ContactForm() {
  const t = useT();
  const tx = useTx();
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, undefined);
  const [v, setV] = useState({ name: "", email: "", topic: "", orderNumber: "", message: "" });
  const bind = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });
  if (state?.ok) {
    return (
      <div className="bg-white p-8">
        <p className="font-display font-normal tracking-[-0.02em] text-2xl">{t("contact.sent")}</p>
        <p className="mt-2 text-[15px] text-black/75">{t("contact.sentBody")}</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder={t("contact.name")} autoComplete="name" className="input" {...bind("name")} />
        <input name="email" type="email" required placeholder={t("contact.email")} autoComplete="email" className="input" {...bind("email")} />
        <select name="topic" required className="input" {...bind("topic")}>
          <option value="" disabled>{t("contact.topic")}</option>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {t(`contact.t.${topic}` as MessageKey)}
            </option>
          ))}
        </select>
        <input name="orderNumber" placeholder={t("contact.order")} className="input" {...bind("orderNumber")} />
      </div>
      <textarea name="message" required minLength={10} rows={6} placeholder={t("contact.message")} className="input" {...bind("message")} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state?.error && <p className="text-[13px] text-red-700">{tx(state.error)}</p>}
      <button className="btn-solid" disabled={pending}>{pending ? t("common.sending") : t("contact.send")}</button>
    </form>
  );
}
