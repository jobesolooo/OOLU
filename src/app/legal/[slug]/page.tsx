import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LEGAL } from "@/content/legal";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const page = LEGAL[(await params).slug];
  return page ? { title: page.title } : { title: "Not found" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = LEGAL[slug];
  if (!page) notFound();
  return (
    <>
      <PageHeader eyebrow="Legal" title={page.title} />
      <div className="container-x section-y grid gap-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Legal pages" className="text-[14px]">
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
          <p className="text-sm text-ash">Last updated {formatDate(page.updated)}</p>
          {page.sections.map((s) => (
            <section key={s.h} className="mt-10">
              <h2 className="text-xl font-semibold">{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-black/75">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
