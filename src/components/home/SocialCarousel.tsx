"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { cx } from "@/lib/format";
import { TikTokIcon } from "@/components/icons";
import { SOCIAL_BADGE, SOCIAL_TILE } from "./social-tile";

/** Horizontal snap carousel with arrow buttons that hide at either end. */
export function Rail({ children, label, prev, next }: { children: React.ReactNode; label: string; prev: string; next: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const btn = "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/10 backdrop-blur transition-opacity hover:bg-white sm:grid";
  return (
    <div className="relative">
      <div ref={ref} role="region" aria-label={label} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 px-1 pb-1">
        {children}
      </div>
      <button type="button" aria-label={prev} onClick={() => go(-1)} className={cx(btn, "left-2", edge.start && "pointer-events-none opacity-0")}>
        <ChevronLeft className="size-5" strokeWidth={1.5} />
      </button>
      <button type="button" aria-label={next} onClick={() => go(1)} className={cx(btn, "right-2", edge.end && "pointer-events-none opacity-0")}>
        <ChevronRight className="size-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** A TikTok tile: plays the video in a pop-up (TikTok's own player) when we know its id, else links out. */
export function TikTokTile({ href, image, caption, videoId, watch, close }: { href: string; image: string | null; caption: string; videoId: string | null; watch: string; close: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  const inner = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- TikTok thumbnails are signed CDN links
        <img src={image} alt={caption || watch} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      ) : (
        <span className="absolute inset-0 bg-ink" />
      )}
      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
      <span className={SOCIAL_BADGE}>
        <TikTokIcon className="size-4" />
      </span>
      {/* Real videos get a play button and their caption; profile tiles look exactly like the Instagram ones */}
      {videoId && (
        <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/50 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Play className="size-5 translate-x-px fill-current" strokeWidth={0} />
        </span>
      )}
      {videoId && caption && (
        <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent px-3 pt-8 pb-3 text-left text-[11px] leading-snug text-white">{caption}</span>
      )}
    </>
  );
  const tile = SOCIAL_TILE;
  if (!videoId)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={tile}>
        {inner}
      </a>
    );
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={tile} aria-label={caption || watch}>
        {inner}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={caption || watch} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative aspect-[9/16] h-[min(86dvh,760px)] max-w-full" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&music_info=1&description=1&rel=0`}
              title={caption || watch}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="size-full bg-black"
            />
            <button type="button" onClick={() => setOpen(false)} aria-label={close} className="absolute -top-11 right-0 grid size-9 place-items-center rounded-full bg-white text-ink">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
