import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LEGAL } from "@/content/legal";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const page = LEGAL[(await params).slug];
  const { t } = await getT();
  return page ? { title: page.title } : { title: t("legal.notFound") };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = LEGAL[slug];
  if (!page) notFound();
  const { t, locale } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("legal.eyebrow")} title={page.title} />
      <div className="container-x section-y grid gap-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label={t("legal.pages")} className="text-[14px]">
          <ul className="space-y-3">
            {Object.entries(LEGAL).map(([s, p]) => (
              <li key={s}>
                <Link href={`/legal/${s}`} className={s === slug ? "font-semibold underline underline-offset-4" : "hover:underline underline-offset-4"}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          {locale !== "en" && <p className="mb-6 bg-stone p-4 text-sm">{t("legal.englishOnly")}</p>}
          <p className="text-sm text-ash">{t("legal.updated", { date: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(new Date(page.updated)) })}</p>
          {page.sections.map((s) => (
            <section key={s.h} className="mt-10">
              <h2 className="text-xl font-semibold">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-black/75">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
