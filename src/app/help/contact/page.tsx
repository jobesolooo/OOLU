import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { InstagramIcon, TikTokIcon } from "@/components/icons";
import { ContactForm } from "./ContactForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("contact.meta") };
}

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("contact.eyebrow")} title={t("contact.title")} />
      <div className="container-x section-y grid gap-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8 text-[15px] leading-relaxed text-black/75">
          <p>{t("contact.intro")}</p>
          <p>
            {t("contact.quick1")} <Link href="/help" className="underline">{t("contact.quick2")}</Link>. {t("contact.quick3")}{" "}
            <Link href="/track" className="underline">{t("contact.quick4")}</Link>.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={site.social.instagram} target="_blank" rel="noreferrer" className="group flex items-center gap-3 border border-black/15 py-2 pr-4 pl-2 text-[12px] tracking-[0.04em] transition-colors hover:border-ink">
              <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)] text-white transition-transform group-hover:scale-110">
                <InstagramIcon className="size-[17px]" />
              </span>
              {t("contact.dm", { handle: site.socialHandles.instagram })}
            </a>
            <a href={site.social.tiktok} target="_blank" rel="noreferrer" className="group flex items-center gap-3 border border-black/15 py-2 pr-4 pl-2 text-[12px] tracking-[0.04em] transition-colors hover:border-ink">
              <span className="grid size-9 place-items-center rounded-full bg-black text-white transition-transform group-hover:scale-110">
                <TikTokIcon className="size-[17px]" />
              </span>
              {site.socialHandles.tiktok}
            </a>
          </div>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
