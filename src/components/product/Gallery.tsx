"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cx } from "@/lib/format";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const count = images.length;
  const go = (d: number) => setActive((i) => (i + d + count) % count);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, count]);

  if (!count) return <div className="aspect-square bg-stone" />;

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {count > 1 && (
        <div className="flex gap-3 lg:w-20 lg:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cx("relative aspect-square w-20 shrink-0 bg-stone ring-offset-2 transition", i === active ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100")}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="group relative aspect-square min-w-0 flex-1 overflow-hidden bg-stone">
        <button className="absolute inset-0 cursor-zoom-in" onClick={() => setZoom(true)} aria-label="Zoom image">
          <Image src={images[active]} alt={name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-contain" />
        </button>
        <span className="pointer-events-none absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </span>
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 lg:hidden">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 lg:hidden">
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={`${name} — zoomed`} className="fixed inset-0 z-[70] bg-white">
          <button onClick={() => setZoom(false)} aria-label="Close zoom" className="absolute top-5 right-5 z-10 grid size-11 place-items-center rounded-full bg-ink text-white">
            <X className="size-5" />
          </button>
          <div
            className="relative h-full w-full cursor-zoom-out overflow-hidden"
            onClick={() => setZoom(false)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
          >
            <Image
              src={images[active]}
              alt={name}
              fill
              sizes="100vw"
              className="object-contain md:scale-[1.8]"
              style={{ transformOrigin: origin }}
            />
          </div>
          {count > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
              <button onClick={() => go(-1)} aria-label="Previous image" className="grid size-11 place-items-center rounded-full bg-ink text-white">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={() => go(1)} aria-label="Next image" className="grid size-11 place-items-center rounded-full bg-ink text-white">
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
