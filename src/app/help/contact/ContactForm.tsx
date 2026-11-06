"use client";

import { useActionState, useState } from "react";
import { sendContact, type ContactState } from "./actions";

const TOPICS = ["Order question", "Returns", "Product question", "Wholesale / collabs", "Press", "Other"];

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, undefined);
  const [v, setV] = useState({ name: "", email: "", topic: "", orderNumber: "", message: "" });
  const bind = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });
  if (state?.ok) {
    return (
      <div className="bg-white p-8">
        <p className="font-display text-2xl font-[800] uppercase">Message sent.</p>
        <p className="mt-2 text-[15px] text-black/75">Thanks — we&apos;ll get back to you within one business day.</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Name" autoComplete="name" className="input" {...bind("name")} />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" {...bind("email")} />
        <select name="topic" required className="input" {...bind("topic")}>
          <option value="" disabled>Topic</option>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input name="orderNumber" placeholder="Order number (optional)" className="input" {...bind("orderNumber")} />
      </div>
      <textarea name="message" required minLength={10} rows={6} placeholder="How can we help?" className="input" {...bind("message")} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state?.error && <p className="text-[13px] text-red-700">{state.error}</p>}
      <button className="btn-solid" disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
