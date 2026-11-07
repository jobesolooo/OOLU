import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import type { JournalPost } from "@/content/journal";
import { ProductCard } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { NewsletterForm } from "@/components/Newsletter";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";

export async function CategoryTiles({ counts }: { counts: Record<string, number> }) {
  const { t } = await getT();
  return (
    <section className="bg-mist pt-[clamp(24px,3vw,56px)] pb-[clamp(56px,7vw,128px)]">
      <div className="container-x">
        <div data-reveal>
        <p className="eyebrow text-ash">{t("home.shopByCategory")}</p>
        <h2 className="mt-2 font-display text-[clamp(30px,2.6vw,44px)] leading-none tracking-[-0.02em]">{t("home.findYourFit")}</h2>
        </div>
        <div data-reveal="stagger" className="mt-[clamp(24px,2.6vw,40px)] grid gap-[clamp(10px,1.1vw,18px)] sm:grid-cols-3">
          {site.categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group block">
              <div className="relative aspect-[4/3] max-h-[calc(100svh-var(--nav-h)-180px)] w-full overflow-hidden bg-stone sm:aspect-[4/5]">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width:640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-3 text-[12px] tracking-[0.06em] uppercase group-hover:underline underline-offset-4">{t(`cat.${c.slug}` as MessageKey)}</h3>
              <p className="mt-1 text-[11px] text-ash">{t("home.pieces", { count: counts[c.slug] ?? 0 })}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * "Our story": giant outlined TRUST drifting behind, framed photo with the spinning
 * badge, headline with the key word in lavender, value tags, then the three-line
 * "Rooted in Africa / Created in Amsterdam / Made for the world" as a numbered band.
 */
export async function Story() {
  const { t } = await getT();
  const { story } = site;
  const title = t("story.title");
  // Highlight the last word of the headline ("trust." / "vertrouwen." …).
  const cut = title.trimEnd().lastIndexOf(" ");
  const [lead, key] = cut > 0 ? [title.slice(0, cut + 1), title.slice(cut + 1)] : ["", title];
  const lines = t("story.p3")
    .split(/(?<=\.)\s+/)
    .map((l) => l.replace(/\.$/, ""))
    .filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden bg-bone">
      <p
        aria-hidden
        className="drift pointer-events-none absolute top-[38%] left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(107,84,224,0.18)]"
        style={{ fontSize: "clamp(200px, 30vw, 520px)" }}
      >
        {t("story.word")} {t("story.word")} {t("story.word")}
      </p>

      <div className="container-x grid items-center gap-[clamp(48px,6vw,112px)] py-[clamp(64px,8vw,140px)] lg:grid-cols-[1fr_1.05fr]">
        {/* photo with offset frame + spinning badge */}
        <div data-reveal className="relative mx-auto w-full max-w-[620px] pr-4 pb-4 sm:pr-6 sm:pb-6">
          <span aria-hidden className="absolute inset-0 top-4 left-4 border border-[#6b54e0]/50 sm:top-6 sm:left-6" />
          <div className="group relative aspect-[4/3] overflow-hidden bg-stone lg:aspect-[5/4]">
            <Image
              src={story.image}
              alt={t("story.alt")}
              fill
              sizes="(min-width:1024px) 45vw, 100vw"
              className="object-cover object-center transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
            <p className="absolute bottom-5 left-5 text-[10px] tracking-[0.2em] text-white/90 uppercase">Amsterdam · {t("brand.established")}</p>
          </div>
          <div aria-hidden className="absolute -top-6 -right-2 grid size-[clamp(88px,9vw,124px)] place-items-center rounded-full bg-ink text-white shadow-[0_20px_40px_-16px_rgba(0,0,0,0.5)] sm:-right-6">
            <svg viewBox="0 0 100 100" className="spin absolute inset-0 size-full">
              <defs>
                <path id="story-badge" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
              </defs>
              <text className="fill-current font-mono text-[9.5px] tracking-[0.24em] uppercase">
                <textPath href="#story-badge">{t("story.signoff")} · </textPath>
              </text>
            </svg>
            <Image src="/images/brand/logo-mark.png" alt="" width={44} height={42} className="w-[38%]" />
          </div>
        </div>

        {/* words */}
        <div data-reveal>
          <p className="text-[11px] tracking-[0.18em] text-[#6b54e0] uppercase">{t("story.eyebrow")}</p>
          <h2 className="mt-4 font-display text-[clamp(44px,5.4vw,96px)] leading-[0.92] tracking-[-0.035em] text-balance">
            {lead}
            <em className="text-[#6b54e0] not-italic">{key}</em>
          </h2>
          <p className="mt-8 max-w-[540px] font-display text-[clamp(19px,1.5vw,24px)] leading-[1.35] tracking-[-0.01em]">{t("story.p1")}</p>
          <p className="mt-5 max-w-[520px] text-[13px] leading-[1.75] text-black/70">{t("story.p2")}</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {(["story.v1", "story.v2", "story.v3", "story.v4"] as const).map((k) => (
              <li key={k} className="rounded-full border border-black/15 bg-white/60 px-4 py-2 text-[11px] tracking-[0.06em] uppercase backdrop-blur">
                {t(k)}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href={story.ctaHref}
              className="group inline-flex items-center gap-3 bg-ink px-6 py-4 text-[11px] tracking-[0.08em] text-white uppercase transition-[transform,background-color] hover:bg-[#6b54e0] active:scale-[0.98]"
            >
              {t("story.cta")}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
            <Link href="/journal/oolu-means-trust" className="text-[11px] tracking-[0.08em] uppercase underline underline-offset-[6px] transition-colors hover:text-[#6b54e0]">
              {t("story.read")}
            </Link>
          </div>
        </div>
      </div>

      {/* Rooted in Africa · Created in Amsterdam · Made for the world */}
      {lines.length === 3 && (
        <div className="border-t border-black/10">
          <ol data-reveal="stagger" className="container-x grid divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {lines.map((l, i) => (
              <li key={l} className="flex items-baseline gap-4 py-7 md:px-8 md:py-10 md:first:pl-0 md:last:pr-0">
                <span className="font-wordmark text-[22px] text-[#6b54e0]">0{i + 1}</span>
                <span className="font-display text-[clamp(22px,2.1vw,34px)] leading-[1.05] tracking-[-0.02em]">{l}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/**
 * Two editorial blocks:
 * 1. "Easy comfort always" — full-bleed photo, oversized headline, frosted-glass card.
 * 2. "Made to move" — dark band, giant outlined MOVE lettering behind layered photos.
 * Images drift slightly as you scroll (CSS scroll-driven animation, see .parallax in globals.css).
 */
export async function Features() {
  const { t } = await getT();
  const [comfort, move] = site.features;
  return (
    <>
      {/* 1 — Easy comfort always */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="parallax absolute inset-0 -z-20">
          <Image src={comfort.image} alt="" fill sizes="100vw" className="object-cover object-[center_38%]" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,6,0.82)_0%,rgba(6,6,6,0.35)_45%,rgba(6,6,6,0)_70%),linear-gradient(0deg,rgba(6,6,6,0.6),transparent_45%)]" />
        <div className="container-x grid min-h-[min(92svh,860px)] items-end gap-10 py-[clamp(56px,8vw,120px)] lg:grid-cols-[1.4fr_1fr]">
          <div data-reveal>
            <p className="text-[11px] tracking-[0.14em] text-accent uppercase">{t("feature.comfort.kicker")}</p>
            <h2 className="mt-5 max-w-[11ch] font-display text-[clamp(52px,8vw,128px)] leading-[0.92] tracking-[-0.035em]">
              {t("feature.comfort.title")}
            </h2>
          </div>
          <div data-reveal className="max-w-[420px] border border-white/20 bg-white/10 p-[clamp(24px,2.4vw,36px)] backdrop-blur-xl lg:justify-self-end">
            <p className="font-display text-[22px] leading-tight tracking-[-0.01em]">{t("feature.comfort.badge")}</p>
            <p className="mt-4 text-[13px] leading-[1.7] text-white/80">{t("feature.comfort.body")}</p>
            <Link
              href={comfort.href}
              className="group mt-7 inline-flex items-center gap-3 bg-white px-5 py-3.5 text-[11px] tracking-[0.08em] text-ink uppercase transition-transform active:scale-[0.98]"
            >
              {t("common.shopNow")}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2 — Made to move */}
      <section className="relative isolate overflow-hidden bg-[#0d0d0d] py-[clamp(72px,9vw,150px)] text-white">
        {/* giant outlined word, drifting sideways */}
        <p
          aria-hidden
          className="drift pointer-events-none absolute top-1/2 left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(165,146,255,0.25)]"
          style={{ fontSize: "clamp(220px, 34vw, 560px)" }}
        >
          {t("feature.move.word")} {t("feature.move.word")} {t("feature.move.word")}
        </p>
        <div className="container-x grid items-center gap-[clamp(48px,6vw,96px)] lg:grid-cols-[1fr_1.15fr]">
          <div data-reveal className="order-2 lg:order-1">
            <p className="text-[11px] tracking-[0.14em] text-accent uppercase">{t("feature.move.kicker")}</p>
            <h2 className="mt-5 font-display text-[clamp(44px,5.6vw,92px)] leading-[0.95] tracking-[-0.03em]">{t("feature.move.title")}</h2>
            <p className="mt-6 max-w-[420px] text-[13px] leading-[1.7] text-white/75">{t("feature.move.body")}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {(["feature.move.tag1", "feature.move.tag2", "feature.move.tag3"] as const).map((k) => (
                <li key={k} className="rounded-full border border-white/20 px-4 py-2 text-[11px] tracking-[0.04em] text-white/85">
                  {t(k)}
                </li>
              ))}
            </ul>
            <Link
              href={move.href}
              className="group mt-9 inline-flex items-center gap-3 bg-accent px-5 py-3.5 text-[11px] tracking-[0.08em] text-ink uppercase transition-[transform,background-color] hover:bg-white active:scale-[0.98]"
            >
              {t("common.shopNow")}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </div>

          <div data-reveal className="relative order-1 mx-auto w-full max-w-[640px] pb-[18%] lg:order-2">
            {/* main photo with an offset lavender frame */}
            <div className="relative">
              <span aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 border border-accent/70 sm:translate-x-6 sm:translate-y-6" />
              <div className="group relative aspect-[4/3] overflow-hidden">
                <Image src={move.image} alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.05]" />
              </div>
            </div>
            {/* overlapping second photo */}
            <div className="float absolute right-0 bottom-0 sm:right-[-4%] w-[44%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-8 ring-[#0d0d0d]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src="/images/brand/tracksuit-duo.jpg" alt="" fill sizes="(min-width:1024px) 20vw, 45vw" className="object-cover object-top" />
              </div>
            </div>
            {/* spinning badge */}
            <div aria-hidden className="absolute bottom-[8%] left-[-2%] grid size-[clamp(84px,9vw,120px)] place-items-center rounded-full bg-white text-ink">
              <svg viewBox="0 0 100 100" className="spin absolute inset-0 size-full">
                <defs>
                  <path id="badge-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
                </defs>
                <text className="fill-current font-mono text-[9.5px] tracking-[0.24em] uppercase">
                  <textPath href="#badge-circle">OOLU · {t("brand.established")} · </textPath>
                </text>
              </svg>
              <Image src="/images/brand/logo-mark.png" alt="" width={44} height={42} className="w-[38%]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export async function ProductRow({
  title,
  products,
  href = "/shop",
  ratings,
}: {
  title: string;
  products: Product[];
  href?: string;
  ratings?: Map<string, { average: number; count: number }>;
}) {
  if (!products.length) return null;
  const { t } = await getT();
  return (
    <section className="section-y bg-mist">
      <div className="container-x">
        <div data-reveal className="mb-[clamp(20px,2.2vw,36px)] flex items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(26px,2.2vw,38px)] leading-none tracking-[-0.02em]">{title}</h2>
          <Link href={href} className="shrink-0 border border-ink px-4 py-3 text-[11px] tracking-[0.06em] uppercase transition-colors hover:bg-ink hover:text-white">
            {t("home.viewAll")}
          </Link>
        </div>
        <div data-reveal="stagger" className="grid grid-cols-2 gap-x-[clamp(8px,0.9vw,16px)] gap-y-[clamp(28px,2.6vw,44px)] lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} rating={ratings?.get(p.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export async function DropBanner({
  eyebrow,
  title,
  body,
  launchAt,
  href,
  image,
}: {
  eyebrow: string;
  title: string;
  body: string;
  launchAt: number;
  href: string;
  image: string | null;
}) {
  const { t } = await getT();
  return (
    <section className="grain relative isolate overflow-hidden bg-ink text-white">
      {image && (
        <Image src={image} alt="" fill sizes="100vw" className="-z-10 object-cover object-[60%_center] opacity-35" />
      )}
      <div className="container-x section-y grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow text-white/70">{eyebrow}</p>
          <h2 className="h-display mt-4">{title}</h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/80">{body}</p>
          <Link href={href} className="btn-outline mt-8">
            {t("drop.notify")} <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <Countdown to={launchAt} className="md:justify-end" />
      </div>
    </section>
  );
}

export async function JournalTeaser({ posts }: { posts: JournalPost[] }) {
  if (!posts.length) return null;
  const { t, locale } = await getT();
  return (
    <section className="section-y bg-bone">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">{t("home.journalEyebrow")}</p>
            <h2 className="mt-3 font-display font-normal tracking-[-0.02em] text-[clamp(28px,2.8vw,48px)] leading-none">{t("home.journalTitle")}</h2>
          </div>
          <Link href="/journal" className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase hover:underline underline-offset-4">
            {t("home.readJournal")} <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <div data-reveal="stagger" className={posts.length === 2 ? "grid gap-8 md:grid-cols-2" : "grid gap-8 md:grid-cols-3"}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image src={p.cover} alt="" fill sizes={posts.length === 2 ? "(min-width:768px) 50vw, 100vw" : "(min-width:768px) 33vw, 100vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: p.coverPosition ?? "center" }} />
              </div>
              <p className="mt-4 text-[11px] tracking-[0.18em] text-ash uppercase">
                {t(`journal.cat.${p.category}`)} · {new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(p.date))}
              </p>
              <h3 className="mt-2 font-display text-[22px] leading-tight tracking-[-0.01em] group-hover:underline underline-offset-4">{p.title}</h3>
              <p className="mt-2 line-clamp-2 text-[14px] text-black/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function NewsletterBand({ percentOff }: { percentOff: number }) {
  const { t } = await getT();
  return (
    <section className="bg-mist py-[clamp(40px,4vw,72px)]">
      <div data-reveal className="container-x">
        <h2 className="font-display text-[clamp(20px,1.7vw,28px)] leading-[1.2] tracking-[-0.015em]">
          {t("home.newsletterTitle")}
        </h2>
        <div className="mt-5">
          <NewsletterForm source="home" variant="box" cta={t("newsletter.subscribe")} />
        </div>
        {percentOff > 0 && <p className="mt-3 text-[11px] text-ash">{t("home.newsletterNote", { percent: percentOff })}</p>}
      </div>
    </section>
  );
}
