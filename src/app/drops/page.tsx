import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getUpcomingDrops } from "@/lib/catalog";
import { toSaved } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";
import { Countdown } from "@/components/Countdown";
import { NotifyMe } from "@/components/NotifyMe";
import { NewsletterForm } from "@/components/Newsletter";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import { Price } from "@/components/Price";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.drops"), description: t("meta.dropsDesc") };
}

export default async function DropsPage() {
  const [drops, { t, locale }] = await Promise.all([getUpcomingDrops(), getT()]);
  return (
    <>
      <PageHeader eyebrow={t("drops.eyebrow")} title={t("drops.title")} />
      <div className="container-x section-y">
        {drops.length === 0 ? (
          <div className="mx-auto max-w-lg text-center">
            <p className="text-[15px] text-black/75">{t("drops.none")}</p>
            <div className="mt-8 text-left">
              <NewsletterForm source="drops" />
            </div>
          </div>
        ) : (
          <div className="space-y-20">
            {drops.map((p) => (
              <article key={p.id} className="grid items-center gap-10 lg:grid-cols-2">
                <Link href={`/products/${p.slug}`} className="relative block aspect-square bg-stone">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-contain" />}
                </Link>
                <div>
                  <p className="eyebrow text-ash">{t("drops.on", { date: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(p.releaseAt!)) })}</p>
                  <h2 className="h-display mt-4">{p.name}</h2>
                  <Price amount={p.unitAmount} compareAt={p.compareAtAmount} currency={p.currency} className="mt-4 text-xl" />
                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-black/75">{p.description}</p>
                  <Countdown to={p.releaseAt!} className="mt-8" />
                  <div className="mt-8 max-w-md">
                    <NotifyMe productId={toSaved(p).id} size="" label={t("drops.notify")} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
