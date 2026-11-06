import Image from "next/image";
import Link from "next/link";
import { StaffMark } from "./StaffMark";
import { getT } from "@/i18n/server";

/**
 * Split layout used by sign in / sign up / reset pages.
 * On desktop it fills exactly one screen below the header; spacing scales with
 * the screen height (vh) so the form fits on short laptops and breathes on big monitors.
 * Left: editorial photo panel (parallax, drifting outlined wordmark, spinning badge).
 * Right: the form on a soft lavender glow.
 */
export async function AuthShell({
  eyebrow,
  title,
  children,
  aside,
  image = "/images/brand/hero.jpg",
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  image?: string;
}) {
  const { t } = await getT();
  return (
    <div className="grid lg:h-[calc(100svh-var(--chrome-h))] lg:min-h-[600px] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative isolate hidden overflow-hidden bg-ink text-white lg:block">
        <div className="hero-zoom absolute inset-0 -z-20">
          <Image src={image} alt="" fill priority sizes="55vw" className="object-cover object-[center_25%]" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(6,6,6,0.92),rgba(6,6,6,0.15)_55%,rgba(6,6,6,0.35))]" />
        {/* giant outlined wordmark sliding slowly across the panel */}
        <p
          aria-hidden
          className="marquee pointer-events-none absolute top-[18%] left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(255,255,255,0.18)]"
          style={{ fontSize: "min(26vh, 16vw)" }}
        >
          OOLU OOLU OOLU OOLU OOLU OOLU
        </p>

        {/* spinning badge */}
        <div aria-hidden className="absolute top-[clamp(24px,4vh,48px)] right-[clamp(24px,3vw,48px)] grid size-[clamp(88px,12vh,120px)] place-items-center rounded-full bg-accent text-ink">
          <svg viewBox="0 0 100 100" className="spin absolute inset-0 size-full">
            <defs>
              <path id="auth-badge" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
            </defs>
            <text className="fill-current font-mono text-[9.5px] tracking-[0.24em] uppercase">
              <textPath href="#auth-badge">OOLU · {t("brand.established")} · </textPath>
            </text>
          </svg>
          <Image src="/images/brand/logo-mark.png" alt="" width={44} height={42} className="w-[38%]" />
        </div>

        <div className="absolute right-[clamp(32px,4vw,64px)] bottom-[clamp(32px,6vh,72px)] left-[clamp(32px,4vw,64px)]">
          {aside && (
            <div className="rise mb-[clamp(16px,3.5vh,36px)] max-w-[440px] border border-white/20 bg-white/10 p-5 backdrop-blur-xl" style={{ "--delay": "300ms" } as React.CSSProperties}>
              <p className="mb-3 text-[10px] tracking-[0.14em] text-accent uppercase">{t("auth.memberPerks")}</p>
              {aside}
            </div>
          )}
          <p className="text-[11px] tracking-[0.14em] text-accent uppercase">{t("popup.eyebrow")}</p>
          <p className="mt-3 font-display text-[clamp(48px,min(5.4vw,10vh),104px)] leading-[0.9] tracking-[-0.035em]">{t("auth.sideTitle")}</p>
        </div>
      </div>

      <div className="relative isolate flex items-center justify-center overflow-y-auto px-5 py-16 sm:px-12 lg:px-[clamp(40px,5vw,96px)] lg:py-[clamp(10px,3.6vh,72px)]">
        {/* soft lavender glow (clipped so it never adds scroll height) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 size-[70%] rounded-full bg-accent/25 blur-[120px]" />
          <div className="absolute -bottom-1/4 -left-1/4 size-[50%] rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <Link
          href="/admin/login"
          title={t("auth.staffAria")}
          aria-label={t("auth.staffAria")}
          className="group absolute top-5 right-5 flex items-center gap-3 text-ash transition-colors hover:text-ink sm:top-6 sm:right-6"
        >
          <span className="max-w-0 overflow-hidden text-[11px] font-semibold tracking-[0.2em] whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-28 group-hover:opacity-100">
            {t("auth.staff")}
          </span>
          <span className="grid h-[53px] w-[67px] place-items-center rounded-full border border-black/15 bg-white transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white">
            <StaffMark className="w-[58px]" />
          </span>
        </Link>

        <div className="rise w-full max-w-[540px]" style={{ "--delay": "120ms" } as React.CSSProperties}>
          {eyebrow && <p className="text-[11px] tracking-[0.14em] text-[#6b54e0] uppercase">{eyebrow}</p>}
          <h1 className="mt-3 mb-[clamp(16px,3.4vh,44px)] font-display text-[clamp(40px,min(4.6vw,8vh),88px)] leading-[0.92] tracking-[-0.03em] text-balance">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
