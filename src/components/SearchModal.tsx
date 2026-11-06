"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Loader2, Search, X } from "lucide-react";
import type { MessageKey } from "@/i18n/messages";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";
import { Price } from "./Price";
import { useT } from "./Prefs";

type Result = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  image2: string | null;
  category: string;
  unitAmount: number;
  compareAtAmount: number | null;
  currency: string;
  soldOut: boolean;
};

const SUGGESTIONS = ["Tracksuit", "Washed", "Cropped", "Pink", "Tank"];

/** Full-screen search: results appear as product cards while you type. */
export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ q: string; total: number; results: Result[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Focus, lock page scroll, Escape to close.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Debounced live search.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setData(await res.json());
      } catch {
        /* aborted or offline */
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const term = q.trim();
  const shown = term.length >= 2 && data?.q === term ? data : null;
  const goAll = () => {
    if (!term) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className={cx("fixed inset-0 z-[70]", !open && "pointer-events-none")} aria-hidden={!open}>
      <div className={cx("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("search.title")}
        inert={!open}
        className={cx(
          "absolute inset-x-0 top-0 max-h-[100svh] overflow-y-auto bg-mist text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="container-x pt-5 pb-8 sm:pt-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goAll();
            }}
            className="flex items-center gap-3 border-b-2 border-ink pb-3"
          >
            <Search className="size-6 shrink-0" strokeWidth={1.5} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.modalPlaceholder")}
              aria-label={t("search.title")}
              enterKeyHint="search"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-display text-[clamp(26px,4vw,52px)] leading-tight tracking-[-0.02em] placeholder:text-black/25 focus:outline-none"
            />
            {loading && <Loader2 className="size-5 shrink-0 animate-spin text-ash" />}
            <button type="button" onClick={onClose} aria-label={t("search.close")} className="grid size-11 shrink-0 place-items-center rounded-full border border-black/15 transition-transform duration-300 hover:rotate-90 hover:border-ink">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </form>

          {!shown ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] tracking-[0.12em] text-ash uppercase">{t("search.suggest")}</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-black/15 bg-white px-4 py-2 text-[12px] transition-colors hover:border-ink">
                  {s}
                </button>
              ))}
              <span className="mx-2 hidden h-4 w-px bg-black/15 sm:block" />
              {site.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  onClick={onClose}
                  className="group flex items-center gap-2 rounded-full border border-black/15 bg-white py-1 pr-4 pl-1 text-[12px] transition-colors hover:border-ink"
                >
                  <span className="relative size-7 overflow-hidden rounded-full bg-stone">
                    <Image src={c.image} alt="" fill sizes="28px" className="object-cover" />
                  </span>
                  {t(`cat.${c.slug}` as MessageKey)}
                </Link>
              ))}
            </div>
          ) : shown.results.length === 0 ? (
            <p className="mt-10 font-display text-[28px] tracking-[-0.02em] text-black/60">{t("search.none", { q: term })}</p>
          ) : (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 xl:grid-cols-8">
                {shown.results.map((r, i) => (
                  <li key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <Link href={`/products/${r.slug}`} onClick={onClose} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                        {r.image && <Image src={r.image} alt={r.name} fill sizes="(min-width:1280px) 12vw, (min-width:640px) 24vw, 46vw" className={cx("object-cover transition duration-500 group-hover:scale-[1.03]", r.image2 && "group-hover:opacity-0")} />}
                        {r.image2 && <Image src={r.image2} alt="" fill sizes="(min-width:1024px) 22vw, 46vw" className="object-cover opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100" />}
                        {r.soldOut && <span className="absolute top-2.5 left-2.5 bg-white px-2 py-1 text-[10px] tracking-[0.06em] uppercase">{t("badge.soldOut")}</span>}
                        <span className="absolute right-2.5 bottom-2.5 grid size-9 translate-y-2 place-items-center rounded-full bg-accent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <ArrowUpRight className="size-4" strokeWidth={1.5} />
                        </span>
                      </div>
                      <p className="mt-2.5 text-[10px] tracking-[0.1em] text-ash uppercase">{t(`cat.${r.category}` as MessageKey)}</p>
                      <p className="mt-0.5 text-[12px] leading-snug uppercase">{r.name}</p>
                      <Price amount={r.unitAmount} compareAt={r.compareAtAmount} currency={r.currency} className="mt-0.5 text-[12px]" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between gap-4">
                <span className="hidden text-[11px] text-ash sm:block">{t("search.esc")}</span>
                <button type="button" onClick={goAll} className="btn-solid ml-auto gap-3 px-6 py-3.5 text-[11px]">
                  {t("search.viewAll", { count: shown.total })} <ArrowRight className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
