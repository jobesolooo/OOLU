"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ to, className, size = "lg" }: { to: number; className?: string; size?: "sm" | "lg" }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const p = parts(to - (now ?? to));
  const cells: [number, string][] = [
    [p.d, "Days"],
    [p.h, "Hrs"],
    [p.m, "Min"],
    [p.s, "Sec"],
  ];
  return (
    <div className={cx("flex gap-3 sm:gap-5", className)} role="timer" aria-live="off" suppressHydrationWarning>
      {cells.map(([v, l]) => (
        <div key={l} className="text-center">
          <div
            className={cx(
              "font-wordmark tabular-nums tracking-[0.02em]",
              size === "lg" ? "text-[clamp(36px,4.4vw,72px)] leading-none" : "text-xl",
            )}
          >
            {now == null ? "--" : String(v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.2em] uppercase opacity-70">{l}</div>
        </div>
      ))}
    </div>
  );
}
