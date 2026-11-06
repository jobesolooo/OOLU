import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import { shippingConfig } from "@/lib/shipping";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/i18n/server";
import { getMoney } from "@/lib/rates";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.about") };
}

export default async function AboutPage() {
  const { freeShippingThreshold, flatRate } = shippingConfig();
  const [{ t }, { money }] = await Promise.all([getT(), getMoney()]);
  return (
    <>
      <PageHeader eyebrow={`${site.name} · ${t("brand.established")}`} title={t("about.title")} />
      <div className="relative aspect-[16/7] max-h-[560px] w-full overflow-hidden bg-stone">
        <Image src={site.story.image} alt={t("about.imageAlt")} fill priority sizes="100vw" className="object-cover object-[center_40%]" />
      </div>
      <div className="container-x grid gap-12 py-14 md:grid-cols-[1.2fr_1fr]">
        <div className="max-w-xl">
          <p className="font-display text-[clamp(30px,2.6vw,44px)] leading-[1.05] tracking-[-0.02em]">{t("story.title")}</p>
          <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-black/80">
            <p>{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
            <p>{t("story.p3")}</p>
          </div>
          <p className="mt-8 text-[13px] uppercase">{t("story.signoff")}</p>
          <Image src="/images/brand/logo.png" alt={site.name} width={120} height={138} className="mt-10 h-auto w-[110px]" />
        </div>
        <div id="shipping" className="scroll-mt-24 space-y-8 border-t border-black/10 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
          <div>
            <h2 className="label font-semibold">{t("about.shipping")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">
              {t("about.shippingBody", { free: money(freeShippingThreshold, "EUR", true), flat: money(flatRate, "EUR", true) })}
            </p>
          </div>
          <div>
            <h2 className="label font-semibold">{t("about.returns")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">{t("about.returnsBody", { days: RETURN_WINDOW_DAYS })}</p>
          </div>
          <div>
            <h2 className="label font-semibold">{t("about.payments")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/75">{t("about.paymentsBody")}</p>
          </div>
          <Link href="/shop" className="btn-solid">
            {t("common.shopNow")}
          </Link>
        </div>
      </div>
    </>
  );
}
