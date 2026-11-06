import Image from "next/image";

/**
 * Dark editorial page hero shared by most storefront pages: optional photo,
 * drifting outlined wordmark, lavender kicker and an oversized serif title.
 * Sits under the transparent header (see HERO_PATHS in Header.tsx).
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  imagePosition = "center",
  word = "OOLU",
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  imagePosition?: string;
  word?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate -mt-[var(--nav-h)] overflow-hidden bg-ink text-white">
      {image && (
        <>
          <div className="parallax absolute inset-0 -z-20">
            <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: imagePosition }} />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,6,0.9),rgba(6,6,6,0.5)_55%,rgba(6,6,6,0.3)),linear-gradient(0deg,rgba(6,6,6,0.85),transparent_60%)]" />
        </>
      )}
      <p
        aria-hidden
        className="drift pointer-events-none absolute top-1/2 left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(165,146,255,0.2)]"
        style={{ fontSize: "clamp(180px, 28vw, 440px)" }}
      >
        {word} {word} {word}
      </p>
      <div className="container-x flex min-h-[clamp(320px,46svh,480px)] flex-col justify-end pt-[calc(var(--nav-h)+48px)] pb-[clamp(36px,5vw,72px)]">
        {eyebrow && (
          <p className="rise text-[11px] tracking-[0.14em] text-accent uppercase" style={{ "--delay": "80ms" } as React.CSSProperties}>
            {eyebrow}
          </p>
        )}
        <h1 className="rise mt-4 font-display text-[clamp(48px,8vw,128px)] leading-[0.92] tracking-[-0.04em] text-balance" style={{ "--delay": "180ms" } as React.CSSProperties}>
          {title}
        </h1>
        {subtitle && (
          <p className="rise mt-5 max-w-[520px] text-[13px] leading-[1.7] text-white/75" style={{ "--delay": "300ms" } as React.CSSProperties}>
            {subtitle}
          </p>
        )}
        {children && (
          <div className="rise" style={{ "--delay": "380ms" } as React.CSSProperties}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
