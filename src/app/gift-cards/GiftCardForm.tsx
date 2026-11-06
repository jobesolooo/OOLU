"use client";

import { useState } from "react";
import { cx, formatMoneyShort } from "@/lib/format";

export function GiftCardForm({ amounts }: { amounts: number[] }) {
  const [amount, setAmount] = useState(amounts[1] ?? amounts[0]);
  const [forSomeone, setForSomeone] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(form: FormData) {
    setPending(true);
    setError(null);
    const body = {
      amount,
      recipientEmail: forSomeone ? String(form.get("recipientEmail") ?? "") : "",
      recipientName: forSomeone ? String(form.get("recipientName") ?? "") : "",
      senderName: String(form.get("senderName") ?? ""),
      message: forSomeone ? String(form.get("message") ?? "") : "",
    };
    const res = await fetch("/api/gift-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong.");
      setPending(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <form action={submit} className="mt-8 space-y-6">
      <fieldset>
        <legend className="label mb-3 font-semibold">Amount</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={amount === a}
              onClick={() => setAmount(a)}
              className={cx("border py-4 text-[15px] font-medium", amount === a ? "border-ink bg-ink text-white" : "border-black/20 hover:border-ink")}
            >
              {formatMoneyShort(a)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={forSomeone} onChange={() => setForSomeone(true)} /> Send to someone
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!forSomeone} onChange={() => setForSomeone(false)} /> Send to me
        </label>
      </fieldset>
      {forSomeone && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="recipientName" placeholder="Their name" maxLength={80} className="input" />
          <input name="recipientEmail" type="email" required placeholder="Their email" className="input" />
          <textarea name="message" rows={3} maxLength={400} placeholder="Add a message (optional)" className="input sm:col-span-2" />
        </div>
      )}
      <input name="senderName" placeholder="Your name (optional)" maxLength={80} className="input" />
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <button className="btn-solid w-full py-5 text-[13px]" disabled={pending}>
        {pending ? "Redirecting…" : `Buy ${formatMoneyShort(amount)} gift card`}
      </button>
    </form>
  );
}
