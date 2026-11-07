import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, JOURNAL, localizePost, readingMinutes } from "@/content/journal";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ArrowUpRight } from "lucide-react";
import { cx } from "@/lib/format";
import { getProducts } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { t, locale } = await getT();
  const post = getPost((await params).slug, locale);
  if (!post) return { title: t("legal.notFound") };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", title: post.title, description: post.excerpt, images: [post.cover] },
  };
}

export default async function JournalPost({ params }: PageProps<"/journal/[slug]">) {
  const { t, locale } = await getT();
  const post = getPost((await params).slug, locale);
  if (!post) notFound();
  const [products, ratings] = await Promise.all([getProducts(), getRatingsMap()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const firstP = post.blocks.findIndex((b) => b.type === "p");
  const more = JOURNAL.filter((p) => p.slug !== post.slug).slice(0, 2).map((p) => localizePost(p, locale));

  return (
    <article>
      <ReadingProgress label={t("journal.progress")} />
      <header className="relative isolate -mt-[var(--nav-h)] flex min-h-[min(92svh,860px)] items-end overflow-hidden bg-ink text-white">
        <div className="parallax absolute inset-0 -z-20">
          <Image src={post.cover} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: post.coverPosition ?? "center" }} />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(6,6,6,0.92),rgba(6,6,6,0.2)_60%,rgba(6,6,6,0.4))]" />
        <div className="container-x pt-28 pb-[clamp(48px,6vw,96px)]">
          <Link href="/journal" className="rise text-[11px] tracking-[0.14em] text-white/60 uppercase hover:text-white" style={{ "--delay": "50ms" } as React.CSSProperties}>
            {t("journal.back")}
          </Link>
          <p className="rise mt-6 flex flex-wrap items-center gap-3 text-[11px] tracking-[0.12em] uppercase" style={{ "--delay": "150ms" } as React.CSSProperties}>
            <Link href={`/journal?category=${post.category.toLowerCase()}`} className="rounded-full bg-accent px-3 py-1.5 text-ink">
              {t(`journal.cat.${post.category}`)}
            </Link>
            <span className="text-white/70">
              {new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(new Date(post.date))} · {t("journal.minRead", { n: readingMinutes(post) })}
            </span>
          </p>
          <h1 className="rise mt-6 max-w-[16ch] font-display text-[clamp(52px,8vw,132px)] leading-[0.9] tracking-[-0.035em]" style={{ "--delay": "260ms" } as React.CSSProperties}>
            {post.title}
          </h1>
        </div>
      </header>

      <div className="container-x section-y">
        <div className="mx-auto max-w-3xl space-y-8">
          <p className="font-display text-[clamp(24px,2.2vw,34px)] leading-[1.3] tracking-[-0.01em]">{post.excerpt}</p>
          {post.blocks.map((b, i) => {
            switch (b.type) {
              case "p":
                return (
                  <p
                    key={i}
                    className={cx(
                      "text-[15px] leading-[1.85] text-black/80",
                      i === firstP && "first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-[72px] first-letter:leading-[0.8] first-letter:text-accent",
                    )}
                  >
                    {b.text}
                  </p>
                );
              case "h2":
                return <h2 key={i} className="pt-6 font-display font-normal tracking-[-0.02em] text-3xl">{b.text}</h2>;
              case "quote":
                return (
                  <blockquote key={i} className="relative my-6 border-y border-black/10 py-10 text-center">
                    <span aria-hidden className="absolute -top-7 left-1/2 -translate-x-1/2 bg-mist px-4 font-display text-[64px] leading-none text-accent">“</span>
                    <p className="mx-auto max-w-[24ch] font-display text-[clamp(28px,3vw,44px)] leading-[1.1] tracking-[-0.02em]">{b.text}</p>
                    {b.by && <footer className="mt-4 text-[11px] tracking-[0.14em] text-ash uppercase">— {b.by}</footer>}
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
              case "list":
                return (
                  <section key={i}>
                    {b.title && <h3 className="eyebrow mb-4">{b.title}</h3>}
                    <dl className="divide-y divide-black/10 border-y border-black/10">
                      {b.items.map((it, j) => (
                        <div key={j} className="grid gap-1 py-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-8">
                          <dt className="font-display text-[22px] leading-tight tracking-[-0.01em]">
                            <span className="mr-2 font-mono text-[11px] tracking-normal text-accent tabular-nums">{String(j + 1).padStart(2, "0")}</span>
                            {it.label}
                          </dt>
                          <dd className="text-[15px] leading-[1.75] text-black/75">{it.text}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              case "products": {
                const items = b.slugs.map((s) => bySlug.get(s)).filter((p) => p != null);
                if (!items.length) return null;
                return (
                  <section key={i} className="bg-mist p-6 sm:-mx-[8%] sm:p-10">
                    <h2 className="eyebrow mb-6">{b.title ?? t("journal.shopLook")}</h2>
                    <div className={cx("grid grid-cols-2 gap-6", items.length === 3 && "sm:grid-cols-3")}>
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
        <section className="bg-[#0d0d0d] py-[clamp(64px,8vw,128px)] text-white">
          <div className="container-x">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="font-display text-[clamp(36px,4vw,64px)] leading-none tracking-[-0.03em]">{t("journal.more")}</h2>
              <Link href="/journal" className="shrink-0 border border-white/30 px-4 py-3 text-[11px] tracking-[0.08em] uppercase transition-colors hover:bg-white hover:text-ink">
                {t("journal.allStories")}
              </Link>
            </div>
            <div data-reveal="stagger" className="grid gap-6 md:grid-cols-2">
              {more.map((p) => (
                <Link key={p.slug} href={`/journal/${p.slug}`} className="group relative isolate block aspect-[16/11] overflow-hidden">
                  <Image src={p.cover} alt="" fill sizes="50vw" className="-z-20 object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]" style={{ objectPosition: p.coverPosition ?? "center" }} />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-[clamp(20px,2.4vw,36px)]">
                    <div>
                      <p className="text-[11px] tracking-[0.12em] text-accent uppercase">{t(`journal.cat.${p.category}`)} · {t("journal.minRead", { n: readingMinutes(p) })}</p>
                      <h3 className="mt-2 font-display text-[clamp(26px,2.6vw,40px)] leading-[1.05] tracking-[-0.02em]">{p.title}</h3>
                    </div>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-500 group-hover:rotate-45">
                      <ArrowUpRight className="size-5" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
