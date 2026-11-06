"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Copy, X } from "lucide-react";
import { cx } from "@/lib/format";
import { useT, useTx } from "./Prefs";

function useSubscribe(source: string) {
  const t = useT();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState<string | null>(null);

  async function subscribe(email: string) {
    setState("sending");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string | null; already?: boolean };
    if (!res.ok) {
      setMessage(data.error ?? t("newsletter.error"));
      setState("error");
      return;
    }
    try {
      localStorage.setItem("oolu-subscribed", "1");
    } catch {}
    setCode(data.code ?? null);
    setMessage(data.already ? t("newsletter.already") : data.code ? t("newsletter.inCode") : t("newsletter.inInbox"));
    setState("done");
  }
  return { state, message, code, subscribe };
}

function CodeBox({ code }: { code: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => setCopied(true));
      }}
      className="mt-3 flex w-full items-center justify-between border border-dashed border-current px-4 py-3 font-mono text-lg tracking-[0.2em]"
    >
      {code}
      <span className="flex items-center gap-1 font-sans text-[10px] tracking-[0.14em] uppercase">
        <Copy className="size-3.5" /> {copied ? t("newsletter.copied") : t("newsletter.copy")}
      </span>
    </button>
  );
}

export function NewsletterForm({
  source = "footer",
  dark = false,
  cta = "Subscribe",
  variant = "line",
}: {
  source?: string;
  dark?: boolean;
  cta?: string;
  /** "box" = the large OOLU field with a black arrow button */
  variant?: "line" | "box";
}) {
  const t = useT();
  const tx = useTx();
  const { state, message, code, subscribe } = useSubscribe(source);
  const [email, setEmail] = useState("");
  if (state === "done") {
    return (
      <div className="text-sm">
        <p>{tx(message)}</p>
        {code && <CodeBox code={code} />}
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        subscribe(email);
      }}
      className="w-full"
    >
      {variant === "box" ? (
        <div className="flex items-center bg-white p-2 pl-5 ring-1 ring-black/5 focus-within:ring-ink">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.emailAddress")}
            aria-label={t("newsletter.emailAddress")}
            className="w-full bg-transparent py-3 text-[16px] placeholder:text-black/45 focus:outline-none"
          />
          <button aria-label={cta} className="grid size-11 shrink-0 place-items-center bg-ink text-white transition-opacity hover:opacity-85" disabled={state === "sending"}>
            {state === "sending" ? "…" : <ArrowRight className="size-4" strokeWidth={1.5} />}
          </button>
        </div>
      ) : (
      <div className={cx("flex border-b", dark ? "border-white/50" : "border-ink")}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletter.placeholder")}
          aria-label={t("newsletter.emailAddress")}
          className={cx("w-full bg-transparent py-3 text-[16px] focus:outline-none", dark ? "placeholder:text-white/50" : "placeholder:text-black/40")}
        />
        <button className="flex shrink-0 items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase" disabled={state === "sending"}>
          {state === "sending" ? "…" : cta} <ArrowRight className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      )}
      {state === "error" && <p className="mt-2 text-xs text-red-500">{tx(message)}</p>}
      <p className={cx("mt-3 text-[11px]", dark ? "text-white/50" : "text-ash")}>
        {t("newsletter.consent")}{" "}
        <Link href="/legal/privacy" className="underline">{t("newsletter.privacyLink")}</Link>.
      </p>
    </form>
  );
}

const HIDE_ON = ["/admin", "/checkout", "/account", "/cart"];

export function NewsletterPopup({ percentOff, delaySeconds }: { percentOff: number; delaySeconds: number }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (HIDE_ON.some((p) => pathname.startsWith(p))) return;
    let skip = false;
    try {
      const dismissed = Number(localStorage.getItem("oolu-popup-dismissed") ?? 0);
      skip = localStorage.getItem("oolu-subscribed") === "1" || Date.now() - dismissed < 14 * 86_400_000;
    } catch {}
    if (skip) return;
    const t = setTimeout(() => setOpen(true), delaySeconds * 1000);
    return () => clearTimeout(t);
  }, [pathname, delaySeconds]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem("oolu-popup-dismissed", String(Date.now()));
    } catch {}
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        className="animate-fade-up relative grid w-full max-w-[760px] overflow-hidden bg-ink text-white sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="hidden bg-cover bg-center sm:block"
          style={{ backgroundImage: "url(/images/brand/tracksuit-duo.jpg)", backgroundPosition: "center" }}
          aria-hidden
        />
        <div className="p-8 sm:p-10">
          <button onClick={close} aria-label={t("popup.close")} className="absolute top-4 right-4">
            <X className="size-5" strokeWidth={1.5} />
          </button>
          <p className="eyebrow text-accent">{t("popup.eyebrow")}</p>
          <h2 id="popup-title" className="mt-3 font-display font-normal tracking-[-0.02em] text-[44px] leading-[1]">
            {t("popup.title1", { percent: percentOff })}
            <br />
            {t("popup.title2")}
          </h2>
          <p className="mt-4 text-sm text-white/75">{t("popup.body")}</p>
          <div className="mt-6">
            <NewsletterForm source="popup" dark cta={t("popup.cta")} />
          </div>
          <button onClick={close} className="mt-5 text-[11px] tracking-[0.14em] text-white/60 uppercase underline-offset-4 hover:underline">
            {t("popup.noThanks")}
          </button>
        </div>
      </div>
    </div>
  );
}
