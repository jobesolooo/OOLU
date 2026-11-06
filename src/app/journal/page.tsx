import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { JOURNAL } from "@/content/journal";
import { cx, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Journal", description: "Lookbooks, stories and process from OOLU — rooted in Africa, created in Amsterdam." };

const CATS = ["Lookbook", "Story", "Process"] as const;

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const raw = (await searchParams).category;
  const cat = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  const posts = [...JOURNAL]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((p) => !cat || p.category.toLowerCase() === cat);
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHeader eyebrow="Wear your roots. Tell your story." title="Journal" />
      <div className="container-x section-y">
        <nav className="mb-12 flex flex-wrap gap-2" aria-label="Categories">
          {[undefined, ...CATS].map((c) => (
            <Link
              key={c ?? "all"}
              href={c ? `/journal?category=${c.toLowerCase()}` : "/journal"}
              className={cx(
                "border px-5 py-2.5 text-[11px] font-medium tracking-[0.16em] uppercase",
                (c?.toLowerCase() ?? undefined) === cat ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
              )}
            >
              {c ?? "All"}
            </Link>
          ))}
        </nav>

        {lead && (
          <Link href={`/journal/${lead.slug}`} className="group grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative aspect-[16/10] overflow-hidden bg-ink">
              <Image src={lead.cover} alt="" fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: lead.coverPosition ?? "center" }} />
            </div>
            <div>
              <p className="eyebrow text-ash">{lead.category} · {formatDate(lead.date)}</p>
              <h2 className="h-display mt-4 group-hover:underline underline-offset-8">{lead.title}</h2>
              <p className="mt-5 text-[16px] leading-relaxed text-black/75">{lead.excerpt}</p>
            </div>
          </Link>
        )}

        <div className="mt-20 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image src={p.cover} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: p.coverPosition ?? "center" }} />
              </div>
              <p className="mt-4 text-[11px] tracking-[0.18em] text-ash uppercase">{p.category} · {formatDate(p.date)}</p>
              <h3 className="mt-2 text-xl font-semibold group-hover:underline underline-offset-4">{p.title}</h3>
              <p className="mt-2 text-[14px] text-black/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
        {!posts.length && <p className="text-ash">No posts in this category yet.</p>}
      </div>
    </>
  );
}
