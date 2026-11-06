"use client";

import { cx } from "@/lib/format";
import { useMoney, useT } from "./Prefs";

export function Price({
  amount,
  compareAt,
  currency,
  className,
}: {
  amount: number;
  compareAt?: number | null;
  currency: string;
  className?: string;
}) {
  const { money } = useMoney();
  const sale = compareAt != null && compareAt > amount;
  return (
    <span className={cx("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={sale ? "text-[#a3271b]" : undefined}>{money(amount, currency)}</span>
      {sale && (
        <>
          <s className="text-ash">{money(compareAt!, currency)}</s>
          <span className="text-[0.85em] font-semibold text-[#a3271b]">−{Math.round((1 - amount / compareAt!) * 100)}%</span>
        </>
      )}
    </span>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const t = useT();
  return (
    <span className={cx("inline-flex items-center", className)} aria-label={t("reviews.starsLabel", { value: value.toFixed(1) })} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z"
              fill={`url(#s${i}-${Math.round(fill * 100)})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
