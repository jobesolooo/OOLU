"use client";

import { useEffect, useRef } from "react";

/**
 * Light snowfall drawn on a canvas over the homepage photo.
 * Still flakes only for people who prefer reduced motion; pauses when off-screen or the tab is hidden.
 */
export function Snow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Flake = { x: number; y: number; r: number; vy: number; drift: number; phase: number; a: number };
    let flakes: Flake[] = [];
    let w = 0;
    let h = 0;

    const make = (top = false): Flake => ({
      x: Math.random() * w,
      y: top ? -10 : Math.random() * h,
      r: 0.8 + Math.random() * 2.4,
      vy: 0.25 + Math.random() * 0.7,
      drift: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      a: 0.35 + Math.random() * 0.5,
    });

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(140, (w * h) / 9000));
      flakes = Array.from({ length: count }, () => make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.a})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let visible = true;
    const tick = (t: number) => {
      for (const f of flakes) {
        f.y += f.vy * (0.6 + f.r / 3);
        f.x += Math.sin(t / 1800 + f.phase) * f.drift * 0.5;
        if (f.y > h + 6) Object.assign(f, make(true));
        if (f.x < -6) f.x = w + 6;
        if (f.x > w + 6) f.x = -6;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!still && visible && !document.hidden && !raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw();
    start();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 size-full ${className}`} />;
}
