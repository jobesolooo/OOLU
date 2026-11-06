import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { formatMoneyShort } from "@/lib/format";
import { shippingConfig } from "@/lib/shipping";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const { freeShippingThreshold, flatRate } = shippingConfig();
  return (
    <>
      <PageHeader eyebrow={`${site.name} · ${site.established}`} title="About" />
      <div className="relative aspect-[16/7] max-h-[560px] w-full overflow-hidden bg-stone">
        <Image src={site.story.image} alt="Three friends in OOLU “Your Roots.” t-shirts" fill priority sizes="100vw" className="object-cover object-[center_40%]" />
      </div>
      <div className="container-x grid gap-12 py-14 md:grid-cols-[1.2fr_1fr]">
        <div className="max-w-xl">
          <p className="font-display text-[clamp(30px,2.6vw,44px)] leading-[1.05] tracking-[-0.02em]">{site.story.title}</p>
          <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-black/80">
            {site.story.body.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <p className="mt-8 text-[13px] uppercase">{site.story.signoff}</p>
          <Image src="/images/brand/logo.png" alt={site.name} width={120} height={138} className="mt-10 h-auto w-[110px]" />
        </div>
        <div id="shipping" className="scroll-mt-24 space-y-8 border-t border-black/10 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
          <div>
            <h2 className="label font-semibold">Shipping</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">
              Free shipping on orders over {formatMoneyShort(freeShippingThreshold)}. Otherwise a flat {formatMoneyShort(flatRate)}.
              Orders ship within 2–4 business days, worldwide.
            </p>
          </div>
          <div>
            <h2 className="label font-semibold">Returns</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">
              Unworn items with tags can be returned within 30 days. Reach out with your order number and we&apos;ll sort it.
            </p>
          </div>
          <div>
            <h2 className="label font-semibold">Payments</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">
              Checkout is handled by Stripe. We never see or store your card details.
            </p>
          </div>
          <Link href="/shop" className="btn-solid">
            Shop now
          </Link>
        </div>
      </div>
    </>
  );
}
