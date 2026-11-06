import Link from "next/link";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";

export function Logo({ className, divider = false }: { className?: string; divider?: boolean }) {
  return (
    <Link href="/" className={cx("flex items-center text-white", className)} aria-label={`${site.name} home`}>
      <span className="font-serif text-[34px] leading-none font-black tracking-tight sm:text-[clamp(32px,3.6vw,48px)]">W</span>
      {divider && <span className="mx-6 h-12 w-px bg-white/40" aria-hidden />}
      <span
        className={cx(
          "text-[11px] font-medium tracking-(--tracking-mark) sm:text-[clamp(11px,1.15vw,15px)]",
          divider ? "" : "ml-5 sm:ml-7",
        )}
      >
        {site.wordmark}
      </span>
    </Link>
  );
}
