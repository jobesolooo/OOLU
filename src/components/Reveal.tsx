"use client";

import { useEffect } from "react";

/**
 * Watches every [data-reveal] element and adds `is-in` when it scrolls into view,
 * which plays the fade-up defined in globals.css. Mounted once in the root layout;
 * new elements (client navigations, late-rendered sections) are picked up by a MutationObserver.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    let first = true;
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.dataset.reveal === "stagger") {
          Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 8))));
        }
        // On first load, whatever is already on screen just shows (no flash);
        // the hero has its own entrance animation.
        if (first && el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
        else io.observe(el);
      });
    };
    scan();
    first = false;
    root.classList.add("reveal-ready");
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
