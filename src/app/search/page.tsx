import type { Metadata } from "next";
import { queryProducts } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.search") };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = q ? await queryProducts({ q }) : [];
  const { t } = await getT();

  return (
    <>
      <PageHeader eyebrow={t("search.title")} title={q ? `“${q}”` : t("search.title")}>
        <form action="/search" className="mt-6 flex max-w-md">
          <input name="q" defaultValue={q} placeholder={t("nav.searchPlaceholder")} className="input" />
          <button className="btn-solid ml-2 py-3">{t("search.go")}</button>
        </form>
      </PageHeader>
      <div className="container-x py-10">
        {q && (
          <p className="mb-5 text-xs text-ash">
            {results.length === 1 ? t("search.result") : t("search.results", { count: results.length })}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </>
  );
}
