"use client";

import { useEffect, useRef } from "react";

/**
 * Light snowfall on a canvas. `fixed` covers the whole screen above the page (clicks pass through);
 * otherwise it fills its parent. Flakes are white with a soft grey halo so they read on light and dark
 * backgrounds. Skipped entirely for people who prefer reduced motion; pauses in hidden tabs.
 */
export function Snow({ fixed = false, className = "" }: { fixed?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pre-drawn flakes (one per size) so each frame is just image copies, cheap even on phones.
    const SIZES = [1.2, 1.8, 2.4, 3.2];
    // Two sets: on light pages the halo is stronger so white flakes still show.
    const makeSprites = (fill: string, halo: string, blur: number) => SIZES.map((r) => {
      const pad = 5;
      const s = document.createElement("canvas");
      s.width = s.height = Math.ceil((r + pad) * 2 * dpr);
      const c = s.getContext("2d")!;
      c.scale(dpr, dpr);
      c.shadowColor = halo;
      c.shadowBlur = blur;
      c.fillStyle = fill;
      c.beginPath();
      c.arc(r + pad, r + pad, r, 0, Math.PI * 2);
      c.fill();
      return { img: s, half: r + pad };
    });
    const night = makeSprites("#fff", "rgba(70, 70, 100, 0.45)", 4);
    const day = makeSprites("#dcd6f5", "rgba(150, 138, 210, 0.7)", 2.5);
    const root = document.documentElement;

    type Flake = { x: number; y: number; k: number; vy: number; drift: number; phase: number; a: number };
    let flakes: Flake[] = [];
    let w = 0;
    let h = 0;
    const make = (top = false): Flake => {
      const k = Math.floor(Math.random() * SIZES.length);
      return {
        x: Math.random() * w,
        y: top ? -10 : Math.random() * h,
        k,
        vy: 0.3 + Math.random() * 0.5 + k * 0.15,
        drift: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        a: 0.55 + Math.random() * 0.45,
      };
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(fixed ? 90 : 140, (w * h) / (fixed ? 14000 : 9000)));
      flakes = Array.from({ length: count }, () => make());
    };

    let raf = 0;
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const sprites = root.dataset.theme === "dark" ? night : day;
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(t / 1800 + f.phase) * f.drift * 0.5;
        if (f.y > h + 8) Object.assign(f, make(true));
        if (f.x < -8) f.x = w + 8;
        if (f.x > w + 8) f.x = -8;
        const s = sprites[f.k];
        ctx.globalAlpha = f.a;
        ctx.drawImage(s.img, f.x - s.half, f.y - s.half, s.half * 2, s.half * 2);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!document.hidden && !raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    start();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fixed]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none ${fixed ? "fixed inset-0 z-30 h-dvh w-screen" : "absolute inset-0 size-full"} ${className}`}
    />
  );
}
