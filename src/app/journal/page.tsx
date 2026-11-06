import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { JOURNAL, localizePost, readingMinutes } from "@/content/journal";
import { cx } from "@/lib/format";
import { NewsletterForm } from "@/components/Newsletter";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("journal.meta"), description: t("journal.metaDesc") };
}

const CATS = ["Lookbook", "Story", "Process"] as const;

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const raw = (await searchParams).category;
  const cat = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  const { t, locale } = await getT();
  const fmtDate = (d: string) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(d));
  const posts = [...JOURNAL]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((p) => !cat || p.category.toLowerCase() === cat)
    .map((p) => localizePost(p, locale));
  const [lead, ...rest] = posts;
  const meta = (p: (typeof posts)[number]) =>
    `${t(`journal.cat.${p.category}`)} · ${fmtDate(p.date)} · ${t("journal.minRead", { n: readingMinutes(p) })}`;

  return (
    <>
      {/* Cover story: full-bleed, oversized title */}
      {lead ? (
        <Link href={`/journal/${lead.slug}`} className="group relative isolate -mt-[var(--nav-h)] block overflow-hidden bg-ink text-white">
          <div className="parallax absolute inset-0 -z-20">
            <Image
              src={lead.cover}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.03]"
              style={{ objectPosition: lead.coverPosition ?? "center" }}
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(6,6,6,0.92),rgba(6,6,6,0.25)_55%,rgba(6,6,6,0.45))]" />
          <div className="container-x flex min-h-[min(88svh,820px)] flex-col justify-end pt-28 pb-[clamp(48px,6vw,96px)]">
            <p className="rise text-[11px] tracking-[0.14em] text-accent uppercase" style={{ "--delay": "100ms" } as React.CSSProperties}>
              {t("journal.meta")} — {t("journal.latest")}
            </p>
            <h1
              className="rise mt-5 max-w-[16ch] font-display text-[clamp(52px,8.4vw,140px)] leading-[0.9] tracking-[-0.035em]"
              style={{ "--delay": "220ms" } as React.CSSProperties}
            >
              {lead.title}
            </h1>
            <div className="rise mt-8 flex flex-wrap items-end justify-between gap-6" style={{ "--delay": "360ms" } as React.CSSProperties}>
              <div className="max-w-[520px]">
                <p className="text-[11px] tracking-[0.08em] text-white/60 uppercase">{meta(lead)}</p>
                <p className="mt-3 text-[14px] leading-[1.7] text-white/85">{lead.excerpt}</p>
              </div>
              <span className="inline-flex items-center gap-3 bg-white px-5 py-3.5 text-[11px] tracking-[0.08em] text-ink uppercase">
                {t("journal.readStory")}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <section className="-mt-[var(--nav-h)] bg-ink pt-40 pb-16 text-white">
          <div className="container-x">
            <h1 className="font-display text-[clamp(52px,8vw,128px)] leading-none tracking-[-0.035em]">{t("journal.meta")}</h1>
          </div>
        </section>
      )}

      {/* Category filter: sideways-scrolling pill bar */}
      <div className="sticky top-[var(--nav-h)] z-20 border-b border-black/10 bg-mist/95 backdrop-blur">
        <nav className="container-x no-scrollbar flex gap-2 overflow-x-auto py-4" aria-label={t("shop.categories")}>
          {[undefined, ...CATS].map((c) => {
            const active = (c?.toLowerCase() ?? undefined) === cat;
            return (
              <Link
                key={c ?? "all"}
                href={c ? `/journal?category=${c.toLowerCase()}` : "/journal"}
                scroll={false}
                className={cx(
                  "shrink-0 rounded-full border px-5 py-2 text-[11px] tracking-[0.08em] whitespace-nowrap uppercase transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-black/15 hover:border-ink",
                )}
              >
                {c ? t(`journal.cat.${c}`) : t("journal.allStories")}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Story grid: staggered editorial columns with big index numbers */}
      <section className="bg-mist py-[clamp(56px,7vw,120px)]">
        <div className="container-x">
          {rest.length > 0 && (
            <div data-reveal="stagger" className="grid gap-x-[clamp(24px,4vw,72px)] gap-y-20 md:grid-cols-2">
              {rest.map((p, i) => (
                <Link key={p.slug} href={`/journal/${p.slug}`} className={cx("group block", i % 2 === 1 && "md:mt-[clamp(80px,10vw,180px)]")}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                    <Image
                      src={p.cover}
                      alt=""
                      fill
                      sizes="(min-width:768px) 45vw, 100vw"
                      className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
                      style={{ objectPosition: p.coverPosition ?? "center" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute top-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase backdrop-blur">
                      {t(`journal.cat.${p.category}`)}
                    </span>
                    <span className="absolute right-5 bottom-5 grid size-12 translate-y-3 place-items-center rounded-full bg-accent text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="size-5" strokeWidth={1.5} />
                    </span>
                  </div>
                  <div className="mt-6 flex gap-5">
                    <span className="font-wordmark text-[clamp(48px,5vw,80px)] leading-[0.8] text-black/10 transition-colors duration-500 group-hover:text-accent">
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[11px] tracking-[0.08em] text-ash uppercase">{meta(p)}</p>
                      <h2 className="mt-2 font-display text-[clamp(26px,2.4vw,38px)] leading-[1.05] tracking-[-0.02em] underline-offset-[6px] group-hover:underline">
                        {p.title}
                      </h2>
                      <p className="mt-3 max-w-[460px] text-[13px] leading-[1.7] text-black/70">{p.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!posts.length && <p className="text-ash">{t("journal.none")}</p>}
        </div>
      </section>

      {/* Closing band: drifting outlined word + newsletter */}
      <section className="relative isolate overflow-hidden bg-[#0d0d0d] py-[clamp(72px,9vw,140px)] text-white">
        <p
          aria-hidden
          className="drift pointer-events-none absolute top-1/2 left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(165,146,255,0.22)]"
          style={{ fontSize: "clamp(200px, 30vw, 500px)" }}
        >
          {t("journal.word")} {t("journal.word")} {t("journal.word")}
        </p>
        <div data-reveal className="container-x grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
          <h2 className="max-w-[14ch] font-display text-[clamp(44px,6vw,96px)] leading-[0.95] tracking-[-0.03em]">{t("journal.bandTitle")}</h2>
          <div>
            <p className="mb-6 text-[13px] leading-[1.7] text-white/75">{t("journal.bandBody")}</p>
            <NewsletterForm source="journal" dark cta={t("newsletter.join")} />
          </div>
        </div>
      </section>
    </>
  );
}
