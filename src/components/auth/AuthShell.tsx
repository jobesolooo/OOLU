import Image from "next/image";
import Link from "next/link";
import { KeyRound } from "lucide-react";

/** Split layout used by sign in / sign up / reset pages. */
export function AuthShell({ eyebrow, title, children, image = "/images/drops-photo.jpg" }: { eyebrow?: string; title: string; children: React.ReactNode; image?: string }) {
  return (
    <div className="grid min-h-[calc(100dvh-140px)] lg:grid-cols-2">
      <div className="relative hidden bg-ink lg:block">
        <Image src={image} alt="" fill priority sizes="50vw" className="object-cover object-[30%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-10 left-10 font-script text-6xl text-white">Wstablished</p>
      </div>
      <div className="relative flex items-center justify-center px-4 py-14 sm:px-10">
        <Link
          href="/admin/login"
          title="Staff sign-in"
          aria-label="Staff sign-in"
          className="group absolute top-5 right-5 flex items-center gap-2 text-ash transition-colors hover:text-ink"
        >
          <span className="max-w-0 overflow-hidden text-[10px] font-semibold tracking-[0.18em] whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-24 group-hover:opacity-100">
            Staff
          </span>
          <span className="grid size-9 place-items-center rounded-full border border-black/15 bg-white group-hover:border-ink">
            <KeyRound className="size-4" strokeWidth={1.5} />
          </span>
        </Link>
        <div className="w-full max-w-[440px]">
          {eyebrow && <p className="eyebrow text-ash">{eyebrow}</p>}
          <h1 className="mt-3 mb-8 font-display text-[clamp(36px,3.4vw,52px)] leading-none font-[900] uppercase">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
