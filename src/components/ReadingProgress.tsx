"use client";

import { useEffect, useRef } from "react";

/** Thin lavender bar under the header that fills as you read the article. */
export function ReadingProgress({ label }: { label: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const article = document.querySelector("article");
    const update = () => {
      if (!article || !bar.current) return;
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.current.style.transform = `scaleX(${p})`;
      bar.current.parentElement?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} className="fixed inset-x-0 top-[var(--nav-h)] z-30 h-[3px] bg-transparent">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
    </div>
  );
}
