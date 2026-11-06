import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, JOURNAL } from "@/content/journal";
import { getProducts } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { formatDate } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", title: post.title, description: post.excerpt, images: [post.cover] },
  };
}

export default async function JournalPost({ params }: PageProps<"/journal/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const [products, ratings] = await Promise.all([getProducts(), getRatingsMap()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const more = JOURNAL.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article>
      <header className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-ink text-white">
        <Image src={post.cover} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-70" style={{ objectPosition: post.coverPosition ?? "center" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="container-x pb-14">
          <Link href={`/journal?category=${post.category.toLowerCase()}`} className="eyebrow text-white/80 hover:text-white">
            {post.category}
          </Link>
          <h1 className="h-display mt-4 max-w-4xl">{post.title}</h1>
          <p className="mt-4 text-sm text-white/70">{formatDate(post.date)}</p>
        </div>
      </header>

      <div className="container-x section-y">
        <div className="mx-auto max-w-3xl space-y-8">
          <p className="text-xl leading-relaxed">{post.excerpt}</p>
          {post.blocks.map((b, i) => {
            switch (b.type) {
              case "p":
                return <p key={i} className="text-[17px] leading-[1.75] text-black/80">{b.text}</p>;
              case "h2":
                return <h2 key={i} className="pt-6 font-display text-3xl font-[900] uppercase">{b.text}</h2>;
              case "quote":
                return (
                  <blockquote key={i} className="border-l-4 border-ink py-2 pl-6">
                    <p className="font-display text-[clamp(24px,2.4vw,36px)] leading-tight font-[800] uppercase">“{b.text}”</p>
                    {b.by && <footer className="mt-3 text-sm text-ash">— {b.by}</footer>}
                  </blockquote>
                );
              case "image":
                return (
                  <figure key={i} className="-mx-4 sm:mx-[-8%]">
                    <div className="relative aspect-[16/10] bg-stone">
                      <Image src={b.src} alt={b.alt} fill sizes="(min-width:768px) 900px, 100vw" className="object-cover" style={{ objectPosition: b.position ?? "center" }} />
                    </div>
                    {b.caption && <figcaption className="mt-3 px-4 text-sm text-ash sm:px-0">{b.caption}</figcaption>}
                  </figure>
                );
              case "products": {
                const items = b.slugs.map((s) => bySlug.get(s)).filter((p) => p != null);
                if (!items.length) return null;
                return (
                  <section key={i} className="bg-mist p-6 sm:-mx-[8%] sm:p-10">
                    <h2 className="eyebrow mb-6">{b.title ?? "Shop the look"}</h2>
                    <div className="grid grid-cols-2 gap-6">
                      {items.map((p) => (
                        <ProductCard key={p.id} product={p} rating={ratings.get(p.id)} />
                      ))}
                    </div>
                  </section>
                );
              }
            }
          })}
        </div>
      </div>

      {more.length > 0 && (
        <section className="section-y border-t border-black/10 bg-bone">
          <div className="container-x">
            <h2 className="eyebrow mb-8">More from the journal</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {more.map((p) => (
                <Link key={p.slug} href={`/journal/${p.slug}`} className="group">
                  <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                    <Image src={p.cover} alt="" fill sizes="50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: p.coverPosition ?? "center" }} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold group-hover:underline underline-offset-4">{p.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
