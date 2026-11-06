import type { Metadata } from "next";
import { queryProducts } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = q ? await queryProducts({ q }) : [];

  return (
    <>
      <PageHeader eyebrow="Search" title={q ? `“${q}”` : "Search"}>
        <form action="/search" className="mt-6 flex max-w-md">
          <input name="q" defaultValue={q} placeholder="Search t-shirts, tracksuits, tanks…" className="input" />
          <button className="btn-solid ml-2 py-3">Go</button>
        </form>
      </PageHeader>
      <div className="container-x py-10">
        {q && (
          <p className="mb-5 text-xs text-ash">
            {results.length} {results.length === 1 ? "result" : "results"}
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
