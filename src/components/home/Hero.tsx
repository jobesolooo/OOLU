import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";

export function Hero() {
  const { hero } = site;
  return (
    <section className="grain relative isolate h-[580px] overflow-hidden bg-[#1b1b1a] text-white md:h-[calc(100svh-var(--chrome-h))] md:min-h-[520px] md:max-h-[1200px]">
      <Image src={hero.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[36%_center] md:object-center" />

      {/* Giant wordmark sits behind the model (skipped when it's baked into the photo) */}
      {!hero.wordmarkInImage && (
      <div
        aria-hidden
        className="pointer-events-none absolute right-[4%] bottom-[14%] -z-10 flex items-start font-display leading-[0.8] font-bold tracking-[-0.035em] text-[#ecebe7] select-none md:top-[54%] md:bottom-auto md:-translate-y-1/2"
        style={{ fontSize: "clamp(52px, 9.7vw, 176px)" }}
      >
        {site.wordmark}
        <span className="mt-[0.02em] ml-[0.04em] text-[0.13em] font-medium tracking-normal">®</span>
      </div>
      )}

      {hero.foreground && (
        <div className="absolute bottom-0 left-[76%] -z-10 aspect-[600/720] h-[64%] -translate-x-1/2 md:left-[49%] md:h-full">
          <Image src={hero.foreground} alt="" fill priority sizes="(min-width:768px) 40vw, 70vw" className="object-contain object-bottom" />
        </div>
      )}

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/35 to-transparent md:hidden" aria-hidden />

      <div className="container-x relative flex h-full flex-col pt-[56px] md:justify-center md:pt-0 md:pb-[4vh]">
        <p className="text-[10px] font-medium tracking-[0.3em] uppercase md:text-[clamp(11px,1.08vw,16px)]">{hero.eyebrow}</p>
        <h1 className="mt-5 font-display text-[40px] leading-[0.94] font-[800] tracking-[0.01em] uppercase md:mt-[clamp(16px,2.2vw,32px)] md:text-[clamp(32px,3.5vw,66px)]">
          {hero.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-5 max-w-[240px] text-[13px] leading-[1.55] text-white/90 md:mt-[clamp(16px,2vw,30px)] md:max-w-none md:text-[clamp(13px,1.25vw,20px)]">
          {hero.body.map((line) => (
            <span key={line} className="md:block">
              {line}{" "}
            </span>
          ))}
        </p>
        <div className="mt-7 md:mt-[clamp(24px,3.6vw,52px)]">
          <Link href={hero.cta.href} className="btn-outline md:px-[clamp(20px,2.4vw,34px)] md:py-[clamp(12px,1.3vw,18px)]">
            {hero.cta.label}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <div className="absolute right-[4.3%] bottom-[8%] hidden items-end gap-6 md:flex">
        <span className="mb-1 h-px w-10 bg-white/70" />
        <div className="text-right text-[clamp(10px,0.9vw,14px)] leading-[1.9] tracking-[0.14em]">
          <p className="mb-3">{site.established}</p>
          {site.coordinates.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
