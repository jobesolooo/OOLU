"use client";

import Image from "next/image";

import { useT, useTx } from "@/components/Prefs";
import { useState } from "react";
import { cx, formatMoneyShort } from "@/lib/format";

export function GiftCardForm({ amounts }: { amounts: number[] }) {
  const t = useT();
  const tx = useTx();
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
      setError(data.error ?? t("common.error"));
      setPending(false);
      return;
    }
    window.location.href = data.url;
  }

  const step = (n: number, label: string) => (
    <legend className="mb-3 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-ink font-wordmark text-[14px] text-white">{n}</span>
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">{label}</span>
    </legend>
  );

  return (
    <div className="grid gap-[clamp(32px,5vw,80px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      {/* Live card preview */}
      <div className="lg:sticky lg:top-[calc(var(--nav-h)+32px)]">
        <div className="group [perspective:1200px]">
          <div className="float relative aspect-[1.6/1] overflow-hidden rounded-[18px] bg-[radial-gradient(120%_120%_at_0%_0%,#2a2340_0%,#0d0d0d_55%)] p-[clamp(20px,3vw,36px)] text-white shadow-[0_40px_80px_-30px_rgba(90,68,207,0.55)] ring-1 ring-white/10 transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(-10deg)_rotateX(6deg)]">
            <div aria-hidden className="pointer-events-none absolute -top-1/2 -left-1/4 h-[200%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-all duration-1000 group-hover:left-[110%] group-hover:opacity-100" />
            <Image src="/images/brand/logo-mark.png" alt="" width={363} height={343} className="pointer-events-none absolute -right-[10%] -bottom-[28%] w-[62%] opacity-90" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-wordmark text-[clamp(32px,4vw,52px)] leading-none tracking-[0.04em]">OOLU</span>
                <span className="text-[10px] tracking-[0.14em] text-accent uppercase">{t("gift.card")}</span>
              </div>
              <div>
                <p key={amount} className="animate-fade-up font-wordmark text-[clamp(56px,7vw,96px)] leading-[0.8]">{formatMoneyShort(amount)}</p>
                <p className="mt-2 text-[11px] tracking-[0.1em] text-white/60 uppercase">{t("brand.established")}</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2">
          {(["gift.perk1", "gift.perk2", "gift.perk3"] as const).map((k) => (
            <li key={k} className="rounded-full border border-black/15 bg-white px-4 py-2 text-[11px] tracking-[0.04em]">
              {t(k)}
            </li>
          ))}
        </ul>
      </div>

      <form action={submit} className="space-y-8 bg-white p-[clamp(20px,3vw,40px)] ring-1 ring-black/5">
        <p className="text-[14px] leading-[1.7] text-black/75">{t("gift.intro")}</p>
        <fieldset>
          {step(1, t("gift.step1"))}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {amounts.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={amount === a}
                onClick={() => setAmount(a)}
                className={cx(
                  "border py-4 font-wordmark text-[22px] leading-none transition-colors",
                  amount === a ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
                )}
              >
                {formatMoneyShort(a)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          {step(2, t("gift.step2"))}
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={forSomeone === v}
                onClick={() => setForSomeone(v)}
                className={cx("border px-4 py-3 text-[12px] transition-colors", forSomeone === v ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink")}
              >
                {v ? t("gift.toSomeone") : t("gift.toMe")}
              </button>
            ))}
          </div>
          {forSomeone && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="recipientName" placeholder={t("gift.theirName")} maxLength={80} className="input" />
              <input name="recipientEmail" type="email" required placeholder={t("gift.theirEmail")} className="input" />
            </div>
          )}
        </fieldset>
        <fieldset>
          {step(3, t("gift.step3"))}
          <div className="grid gap-3">
            {forSomeone && <textarea name="message" rows={3} maxLength={400} placeholder={t("gift.message")} className="input" />}
            <input name="senderName" placeholder={t("gift.yourName")} maxLength={80} className="input" />
          </div>
        </fieldset>
        {error && <p className="text-[13px] text-red-700">{tx(error)}</p>}
        <button className="btn-solid w-full py-5 text-[12px]" disabled={pending}>
          {pending ? t("cart.redirecting") : t("gift.buy", { amount: formatMoneyShort(amount) })}
        </button>
      </form>
    </div>
  );
}
