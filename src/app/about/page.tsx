import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { returnWindowDays } from "@/lib/returns";
import { shippingConfig } from "@/lib/shipping";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";
import { getMoney } from "@/lib/rates";
import { POSTERS } from "@/lib/posters";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMeta({ path: "/about", title: t("meta.about"), description: "OOLU means trust. An Amsterdam streetwear label with West African roots: T-shirts, tanks and tracksuits made to live in the present." });
}

export default async function AboutPage() {
  const { freeShippingThreshold, flatRate } = await shippingConfig();
  const returnDays = await returnWindowDays();
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
            <p className="mt-3 text-sm leading-relaxed text-black/75">{t("about.returnsBody", { days: returnDays })}</p>
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
      {/* Campaign posters: the brand line, "stay in motion", in print */}
      <section className="border-t border-black/10 py-14">
        <div className="container-x">
          <div className="mb-6 flex items-end justify-between gap-6">
            <p className="font-display text-[clamp(28px,2.6vw,40px)] leading-none tracking-[-0.02em]">Stay in motion</p>
            <Link href="/journal/stay-in-motion-the-zine" className="shrink-0 text-[11px] tracking-[0.12em] uppercase underline-offset-4 hover:underline">
              {t("journal.seeZine")} →
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {[POSTERS.stayGraffiti, POSTERS.keepMovingNavy, POSTERS.trackSet, POSTERS.inMotion].map((p) => (
              <Link key={p.src} href="/journal/stay-in-motion-the-zine" className="group relative aspect-[3/4] w-[62%] shrink-0 snap-start overflow-hidden bg-stone sm:w-auto">
                <Image src={p.src} alt={p.alt} fill sizes="(min-width:640px) 25vw, 62vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
