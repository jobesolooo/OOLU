"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Globe } from "lucide-react";
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
      <ScrollRow label={t("prefs.language")}>
        {LOCALES.map((l) => (
          <Chip key={l.code} active={locale === l.code} onClick={() => choose(LOCALE_COOKIE, l.code)} title={l.label}>
            <span className="text-[10px] opacity-60">{l.short}</span> {l.label}
          </Chip>
        ))}
      </ScrollRow>
      <ScrollRow label={t("prefs.currency")}>
        {CURRENCIES.map((c) => (
          <Chip key={c.code} active={currency === c.code} onClick={() => choose(CURRENCY_COOKIE, c.code)} title={c.name}>
            {symbol(c.code, c.locale) !== c.code && <span className="opacity-60">{symbol(c.code, c.locale)}</span>} {c.code}
          </Chip>
        ))}
      </ScrollRow>
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
        <div role="dialog" aria-label={t("prefs.title")} className="animate-fade-down absolute top-[calc(100%+14px)] right-0 z-50 w-[340px] border border-black/10 bg-white p-5 text-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]">
          {body}
        </div>
      )}
    </div>
  );
}

const symbol = (code: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? code;

function Chip({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      data-active={active || undefined}
      onClick={onClick}
      className={cx(
        "shrink-0 snap-start border px-3.5 py-2.5 text-[12px] whitespace-nowrap transition-colors",
        active ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

/** One sideways-scrolling row of options, with arrow buttons and the selected chip scrolled into view. */
function ScrollRow({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };
  useEffect(() => {
    const el = ref.current;
    const active = el?.querySelector<HTMLElement>("[data-active]");
    if (el && active) el.scrollLeft = active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2;
    update();
  }, []);
  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  return (
    // min-w-0: fieldsets otherwise grow to fit their content, which would stop the row from scrolling
    <fieldset className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <legend className="text-[11px] tracking-[0.08em] text-ash uppercase">{label}</legend>
        <div className="flex gap-1">
          <button type="button" aria-label={t("prefs.scrollLeft")} onClick={() => nudge(-1)} disabled={edges.start} className="grid size-6 place-items-center border border-black/10 disabled:opacity-30">
            <ChevronLeft className="size-3.5" />
          </button>
          <button type="button" aria-label={t("prefs.scrollRight")} onClick={() => nudge(1)} disabled={edges.end} className="grid size-6 place-items-center border border-black/10 disabled:opacity-30">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        onScroll={update}
        className={cx(
          "no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth overscroll-x-contain",
          !edges.end && "[mask-image:linear-gradient(to_right,black_85%,transparent)]",
          !edges.start && edges.end && "[mask-image:linear-gradient(to_left,black_85%,transparent)]",
          !edges.start && !edges.end && "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
}
