"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, LOCALE_COOKIE } from "@/i18n/config";
import { CURRENCIES, CURRENCY_COOKIE } from "@/lib/currency";
import { cx } from "@/lib/format";
import { setPreference, useLocale, useMoney, useT } from "./Prefs";

/** Language + currency picker. Saves to cookies, then re-renders the page on the server. */
export function PreferencesMenu({ variant = "header" }: { variant?: "header" | "panel" }) {
  const t = useT();
  const locale = useLocale();
  const { currency } = useMoney();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (cookie: string, value: string) => {
    setPreference(cookie, value);
    start(() => router.refresh());
  };

  const body = (
    <div className={cx("space-y-5", pending && "opacity-60 transition-opacity")}>
      <fieldset>
        <legend className="mb-2 text-[11px] tracking-[0.08em] text-ash uppercase">{t("prefs.language")}</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              aria-pressed={locale === l.code}
              onClick={() => choose(LOCALE_COOKIE, l.code)}
              className={cx(
                "flex items-center justify-between border px-3 py-2.5 text-[12px] transition-colors",
                locale === l.code ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
              )}
            >
              {l.label}
              {locale === l.code && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[11px] tracking-[0.08em] text-ash uppercase">{t("prefs.currency")}</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              title={c.name}
              aria-pressed={currency === c.code}
              onClick={() => choose(CURRENCY_COOKIE, c.code)}
              className={cx(
                "border px-2 py-2 text-[12px] tracking-[0.04em] transition-colors",
                currency === c.code ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
              )}
            >
              {c.code}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-[11px] leading-relaxed text-ash">{t("prefs.note")}</p>
    </div>
  );

  if (variant === "panel") return body;

  const short = LOCALES.find((l) => l.code === locale)?.short;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("prefs.title")}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em]"
      >
        <Globe className="size-3.5" strokeWidth={1.5} />
        {short} · {currency}
        <ChevronDown className={cx("size-3 transition-transform duration-300", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      {open && (
        <div role="dialog" aria-label={t("prefs.title")} className="animate-fade-down absolute top-[calc(100%+14px)] right-0 z-50 w-[300px] border border-black/10 bg-white p-5 text-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]">
          {body}
        </div>
      )}
    </div>
  );
}
