import Image from "next/image";
import { cx } from "@/lib/format";

/** Accepted payment methods (images in /public/images/payments). */
export const PAYMENTS = [
  { name: "Visa", file: "visa" },
  { name: "Mastercard", file: "mastercard" },
  { name: "American Express", file: "amex" },
  { name: "Maestro", file: "maestro" },
  { name: "Apple Pay", file: "apple-pay" },
  { name: "Google Pay", file: "google-pay" },
  { name: "Klarna", file: "klarna" },
  { name: "PayPal", file: "paypal" },
] as const;

export function PaymentIcons({ className, size = "md", label = "Accepted payment methods" }: { className?: string; size?: "sm" | "md"; label?: string }) {
  return (
    <ul className={cx("flex flex-wrap gap-1.5", className)} aria-label={label}>
      {PAYMENTS.map((p) => (
        <li key={p.file}>
          <Image
            src={`/images/payments/${p.file}.svg`}
            alt={p.name}
            title={p.name}
            width={44}
            height={28}
            className={cx("w-auto rounded-[4px] transition-transform duration-300 hover:-translate-y-0.5", size === "sm" ? "h-[22px]" : "h-7")}
          />
        </li>
      ))}
    </ul>
  );
}
