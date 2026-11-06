"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cx } from "@/lib/format";
import { useT } from "./Prefs";

/**
 * Horizontal, snap-scrolling row (swipe on phones, arrows on desktop).
 * Children are the items; each gets a fixed width so 2 / 3 / 4.5 fit per screen.
 */
export function Scroller({ children, title, action, dark = false }: { children: React.ReactNode; title: string; action?: React.ReactNode; dark?: boolean }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (el) setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
  };
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const btn = cx(
    "grid size-11 place-items-center rounded-full border transition-colors disabled:opacity-30",
    dark ? "border-white/25 hover:bg-white hover:text-ink" : "border-black/15 hover:bg-ink hover:text-white",
  );
  return (
    <div>
      <div className="container-x mb-[clamp(20px,2.4vw,36px)] flex items-end justify-between gap-6">
        <h2 className="font-display text-[clamp(30px,3vw,52px)] leading-none tracking-[-0.03em]">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" className={cx(btn, "hidden sm:grid")} onClick={() => nudge(-1)} disabled={edges.start} aria-label={t("prefs.scrollLeft")}>
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </button>
          <button type="button" className={cx(btn, "hidden sm:grid")} onClick={() => nudge(1)} disabled={edges.end} aria-label={t("prefs.scrollRight")}>
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex snap-x snap-mandatory gap-[clamp(10px,1vw,16px)] overflow-x-auto scroll-px-[clamp(16px,4.3vw,88px)] px-[clamp(16px,4.3vw,88px)] pb-2 [&>*]:w-[46vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[31vw] lg:[&>*]:w-[21vw] 2xl:[&>*]:w-[340px]"
      >
        {children}
      </div>
    </div>
  );
}
