import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";

/** OOLU mark (purple letters + holographic ring). `wordmark` adds the OOLU letters beside it. */
export function Logo({ className, wordmark = false, size = 44 }: { className?: string; wordmark?: boolean; size?: number }) {
  return (
    <Link href="/" className={cx("flex items-center gap-3", className)} aria-label={`${site.name} home`}>
      <Image src="/images/brand/logo-mark.png" alt="" width={size} height={size} priority className="h-auto object-contain" style={{ width: size }} />
      {wordmark && <span className="font-wordmark text-[28px] leading-none tracking-[0.06em]">{site.wordmark}</span>}
    </Link>
  );
}
