import Image from "next/image";
import Link from "next/link";
import { WingedW } from "./WingedW";

/** Split layout used by sign in / sign up / reset pages. */
export function AuthShell({ eyebrow, title, children, image = "/images/drops-photo.jpg" }: { eyebrow?: string; title: string; children: React.ReactNode; image?: string }) {
  return (
    <div className="grid min-h-[calc(100dvh-120px)] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src={image} alt="" fill priority sizes="55vw" className="object-cover object-[30%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute right-12 bottom-12 left-12 text-white">
          <p className="font-script text-[clamp(56px,5vw,88px)] leading-none">Wstablished</p>
          <p className="mt-4 text-[12px] tracking-[0.3em] text-white/80 uppercase">Built for the real ones.</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-5 py-20 sm:px-12 lg:px-16 lg:py-24">
        <Link
          href="/admin/login"
          title="Staff entrance"
          aria-label="Staff sign-in"
          className="group absolute top-6 right-6 flex items-center gap-3 text-ash transition-colors hover:text-ink sm:top-8 sm:right-8"
        >
          <span className="max-w-0 overflow-hidden text-[11px] font-semibold tracking-[0.2em] whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-28 group-hover:opacity-100">
            Staff
          </span>
          <span className="grid h-11 w-14 place-items-center rounded-full border border-black/15 bg-white transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white">
            <WingedW className="w-9" />
          </span>
        </Link>

        <div className="w-full max-w-[520px]">
          {eyebrow && <p className="eyebrow text-ash">{eyebrow}</p>}
          <h1 className="mt-4 mb-10 font-display text-[clamp(44px,4.4vw,76px)] leading-[0.92] font-[900] uppercase">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
