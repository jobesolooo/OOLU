import Image from "next/image";
import Link from "next/link";
import { StaffMark } from "./StaffMark";

/**
 * Split layout used by sign in / sign up / reset pages.
 * On desktop it fills exactly one screen below the header; spacing scales with
 * the screen height (vh) so the form fits on short laptops and breathes on big monitors.
 */
export function AuthShell({
  eyebrow,
  title,
  children,
  aside,
  image = "/images/brand/tracksuit-duo.jpg",
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="grid lg:h-[calc(100svh-var(--chrome-h))] lg:min-h-[600px] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src={image} alt="" fill priority sizes="55vw" className="object-cover object-[center_30%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute right-[clamp(32px,4vw,64px)] bottom-[clamp(32px,6vh,72px)] left-[clamp(32px,4vw,64px)] text-white">
          {aside}
          <p className="font-display text-[clamp(44px,min(4.4vw,8vh),84px)] leading-none tracking-[-0.025em]">Live in the present.</p>
          <p className="mt-4 text-[12px] tracking-[0.08em] text-white/80 uppercase">OOLU · Built on trust</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-y-auto px-5 py-16 sm:px-12 lg:px-[clamp(40px,5vw,96px)] lg:py-[clamp(10px,3.6vh,72px)]">
        <Link
          href="/admin/login"
          title="Staff entrance"
          aria-label="Staff sign-in"
          className="group absolute top-5 right-5 flex items-center gap-3 text-ash transition-colors hover:text-ink sm:top-6 sm:right-6"
        >
          <span className="max-w-0 overflow-hidden text-[11px] font-semibold tracking-[0.2em] whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-28 group-hover:opacity-100">
            Staff
          </span>
          <span className="grid h-11 w-14 place-items-center rounded-full border border-black/15 bg-white transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white">
            <StaffMark className="w-9" />
          </span>
        </Link>

        <div className="w-full max-w-[540px]">
          {eyebrow && <p className="eyebrow text-ash">{eyebrow}</p>}
          <h1 className="mt-3 mb-[clamp(16px,3.4vh,44px)] font-display font-normal tracking-[-0.02em] text-[clamp(34px,min(3.8vw,7vh),76px)] leading-[0.92] text-balance">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
