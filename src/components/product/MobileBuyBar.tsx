"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";
import { Price } from "../Price";
import { useT } from "../Prefs";

/** Phone-only bar pinned to the bottom while the buy box is off-screen; tapping it scrolls back to sizes. */
export function MobileBuyBar({ name, amount, compareAt, currency, soldOut = false, targetId }: { name: string; amount: number; compareAt: number | null; currency: string; soldOut?: boolean; targetId: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return (
    <div
      className={cx(
        "fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 lg:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] uppercase">{name}</p>
          <Price amount={amount} compareAt={compareAt} currency={currency} className="text-[13px]" />
        </div>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="btn-solid shrink-0 px-5 py-3.5 text-[11px]"
        >
          {soldOut ? t("badge.soldOut") : t("pdp.addToBag")}
        </button>
      </div>
    </div>
  );
}
