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
  const updated = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(new Date(page.updated));
  const anchor = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <>
      <PageHeader eyebrow={`${t("legal.eyebrow")} · ${t("legal.updated", { date: updated })}`} title={page.title} subtitle={t("legal.subtitle")} word="LEGAL" />

      {/* Other legal pages as pills */}
      <div className="sticky top-[var(--nav-h)] z-20 border-b border-black/10 bg-mist/95 backdrop-blur">
        <nav aria-label={t("legal.pages")} className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
          {Object.entries(LEGAL).map(([s, p]) => (
            <Link
              key={s}
              href={`/legal/${s}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors ${s === slug ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:border-ink"}`}
            >
              {p.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="container-x grid gap-12 py-[clamp(48px,6vw,96px)] lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-20">
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--nav-h)+88px)]">
            <p className="mb-4 text-[11px] tracking-[0.14em] text-[#5a44cf] uppercase">{t("legal.contents")}</p>
            <ol className="space-y-2.5 text-[13px]">
              {page.sections.map((sec, i) => (
                <li key={sec.h}>
                  <a href={`#${anchor(sec.h)}`} className="flex gap-3 text-black/70 transition-colors hover:text-ink">
                    <span className="w-5 shrink-0 text-ash tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {sec.h}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>
        <article className="max-w-[720px]">
          {locale !== "en" && <p className="mb-10 border-l-2 border-accent bg-stone p-4 text-[13px]">{t("legal.englishOnly")}</p>}
          {page.sections.map((sec, i) => (
            <section key={sec.h} id={anchor(sec.h)} className="scroll-mt-[calc(var(--nav-h)+88px)] border-t border-black/10 py-8 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-4">
                <span className="font-wordmark text-[28px] leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-[clamp(24px,2.2vw,32px)] leading-tight tracking-[-0.02em]">{sec.h}</h2>
              </div>
              {sec.p.map((para, j) => (
                <p key={j} className="mt-4 text-[14px] leading-[1.85] text-black/75 sm:pl-12">
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
