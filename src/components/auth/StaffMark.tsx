import Image from "next/image";
import { cx } from "@/lib/format";

/** Staff mark: the OOLU logo (purple letters + holographic ring). */
export function StaffMark({ className }: { className?: string }) {
  return <Image src="/images/brand/logo-mark.png" alt="" width={363} height={343} className={cx("h-auto", className)} aria-hidden />;
}
