import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { getT } from "@/i18n/server";

/**
 * Full-bleed hero + black promo strip + serif marquee. Together they fill exactly
 * one screen on desktop; the transparent header floats on top of the photo.
 */
export async function Hero({ promo, holiday = null }: { promo: string; holiday?: { title: string; message: string } | null }) {
  const { t } = await getT();
  const { hero } = site;
  // Christmas theme swaps the headline, buttons, promo strip and marquee lines (all translated unless set in Settings).
  const title = holiday ? holiday.title || t("xmas.title") : t("hero.title");
  const promoText = holiday ? holiday.message || t("xmas.promo") : promo;
  const promoHref = holiday ? "/gift-cards" : site.announcementHref;
  const promoCta = holiday ? t("xmas.giftCards") : t("promo.cta");
  const lines = holiday ? [t("xmas.m1"), t("xmas.m2"), t("xmas.m3")] : [t("marquee.1"), t("marquee.2"), t("marquee.3")];
  return (
    <div className="-mt-[var(--nav-h)] flex flex-col md:h-[100svh] md:min-h-[600px] md:max-h-[1300px]">
      <section className="relative isolate flex h-[78svh] min-h-[480px] items-end overflow-hidden bg-[#10151a] text-white md:h-auto md:min-h-0 md:flex-1">
        <Image src={hero.image} alt={t("hero.alt")} fill priority sizes="100vw" className="hero-zoom -z-20 object-cover object-[55%_center] md:object-[center_40%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/10 to-black/30" />
        <div className="container-x pb-[clamp(36px,5vh,72px)]">
          {/* The brand line is part of the heading so Google reads "OOLU Clothing" as what this page is about. */}
          {holiday && (
            <p
              className="rise mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[10px] tracking-[0.16em] text-[#f1dca2] uppercase ring-1 ring-[#f1dca2]/50 backdrop-blur-sm"
              style={{ "--delay": "150ms" } as React.CSSProperties}
            >
              <span aria-hidden>✦</span> {t("xmas.eyebrow")}
            </p>
          )}
          <h1>
            <span className="rise block text-[11px] tracking-[0.08em] uppercase sm:text-[12px]" style={{ "--delay": "250ms" } as React.CSSProperties}>
              {t("hero.eyebrow").replace(/^OOLU\s*·/, "OOLU Clothing ·")}
            </span>
            <span style={{ "--delay": "400ms" } as React.CSSProperties} className="rise mt-3 block font-display text-[clamp(44px,5.4vw,92px)] leading-[1] tracking-[-0.025em]">
              {title}
            </span>
          </h1>
          <div className="rise mt-[clamp(20px,3vh,36px)] flex flex-wrap gap-3" style={{ "--delay": "600ms" } as React.CSSProperties}>
            <Link
              href={holiday ? "/shop" : hero.ctaHref}
              className="inline-flex bg-white px-6 py-4 text-[12px] tracking-[0.06em] text-ink uppercase transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
            >
              {holiday ? t("xmas.cta") : t("hero.cta")}
            </Link>
            {holiday && (
              <Link
                href="/gift-cards"
                className="inline-flex px-6 py-4 text-[12px] tracking-[0.06em] text-white uppercase ring-1 ring-white/70 transition-[background-color,transform] hover:bg-white/10 active:scale-[0.98]"
              >
                {t("xmas.giftCards")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {promoText && (
        <div className="bg-ink text-white">
          <div className="container-x flex flex-col items-center justify-center gap-4 py-5 text-center sm:flex-row sm:gap-[clamp(32px,6vw,96px)] md:py-[clamp(16px,2.2vh,26px)]">
            <p className="max-w-[440px] text-[11px] leading-[1.6] tracking-[0.06em] uppercase">
              {holiday && <span aria-hidden className="mr-2 text-[#f1dca2]">✦</span>}
              {promoText}
            </p>
            <Link href={promoHref} className="shrink-0 bg-white px-5 py-3.5 text-[11px] tracking-[0.06em] text-ink uppercase hover:opacity-90">
              {promoCta}
            </Link>
          </div>
        </div>
      )}

      <Marquee items={lines} label={t("brand.tagline")} />
    </div>
  );
}

export function Marquee({ items: base, label }: { items: string[]; label: string }) {
  const items = [...base, ...base];
  return (
    <div className="overflow-hidden border-b border-black/5 bg-mist py-[clamp(10px,1.6vh,16px)]" aria-label={label}>
      <div className="marquee flex w-max" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((text, i) => (
              <span key={`${copy}-${i}`} className="flex items-center font-display text-[clamp(18px,1.5vw,24px)] whitespace-nowrap tracking-[-0.01em]">
                <span className="px-[clamp(20px,2.4vw,40px)]">{text}</span>
                <span className="text-black/60">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
