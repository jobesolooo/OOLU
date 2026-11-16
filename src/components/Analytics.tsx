"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/client/track";

/**
 * Counts page views and clicks for Admin → Analytics. No cookies, nothing stored in the browser.
 * Clicks are labelled by a data-track attribute, an aria-label, or the visible text (shortened).
 */
let lastView = { path: "", at: 0 };

export function Analytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const here = pathname + (search.size ? `?${search}` : "");
    // Count each page once, even if this effect runs twice (React dev mode, quick re-renders).
    if (lastView.path === here && Date.now() - lastView.at < 1500) return;
    lastView = { path: here, at: Date.now() };
    track("pageview", first.current && document.referrer ? { r: document.referrer } : {});
    first.current = false;
  }, [pathname, search]);

  useEffect(() => {
    let last = "";
    let lastAt = 0;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-track]");
      if (!el || el.closest("[data-no-track]") || location.pathname.startsWith("/admin")) return;
      const raw = el.dataset.track || el.getAttribute("aria-label") || el.textContent || "";
      const label = raw.replace(/\s+/g, " ").trim().slice(0, 60);
      if (!label) return;
      const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? "" : "";
      const key = label + href;
      if (key === last && Date.now() - lastAt < 800) return; // double clicks count once
      last = key;
      lastAt = Date.now();
      track("click", { l: href && !href.startsWith("#") ? `${label} → ${href.slice(0, 80)}` : label });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
