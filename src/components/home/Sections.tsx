import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import type { JournalPost } from "@/content/journal";
import { formatDate } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { NewsletterForm } from "@/components/Newsletter";

export function CategoryTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="bg-mist pt-[clamp(24px,3vw,56px)] pb-[clamp(56px,7vw,128px)]">
      <div className="container-x">
        <p className="eyebrow text-ash">Shop by category</p>
        <h2 className="mt-2 font-display text-[clamp(30px,2.6vw,44px)] leading-none tracking-[-0.02em]">Find your fit</h2>
        <div className="mt-[clamp(24px,2.6vw,40px)] grid gap-[clamp(10px,1.1vw,18px)] sm:grid-cols-3">
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
              <h3 className="mt-3 text-[12px] tracking-[0.06em] uppercase group-hover:underline underline-offset-4">{c.label}</h3>
              <p className="mt-1 text-[11px] text-ash">{counts[c.slug] ?? 0} pieces</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Story() {
  const { story } = site;
  return (
    <section className="grid bg-bone md:min-h-[min(calc(100svh-var(--nav-h)),900px)] md:grid-cols-[7fr_5fr]">
      <div className="relative aspect-[4/3] md:aspect-auto">
        <Image src={story.image} alt="Three friends in OOLU “Your Roots.” t-shirts walking down a street" fill sizes="(min-width:768px) 58vw, 100vw" className="object-cover" />
      </div>
      <div className="flex items-center px-[clamp(20px,5vw,96px)] py-14">
        <div className="max-w-[440px]">
          <p className="eyebrow">{story.eyebrow}</p>
          <h2 className="mt-3 font-display text-[clamp(30px,2.6vw,44px)] leading-[1.05] tracking-[-0.02em]">{story.title}</h2>
          <div className="mt-6 space-y-4 text-[13px] leading-[1.6]">
            {story.body.map((para) => (
              <p key={para}>{para}</p>
            ))}
            <p className="pt-2 uppercase">{story.signoff}</p>
          </div>
          <Link href={story.cta.href} className="mt-7 inline-flex border border-ink px-5 py-3.5 text-[11px] tracking-[0.06em] uppercase transition-colors hover:bg-ink hover:text-white">
            {story.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <>
      {site.features.map((f) => (
        <section key={f.title} className="grid md:min-h-[clamp(440px,38vw,680px)] md:grid-cols-[5fr_7fr]" style={{ background: f.tone }}>
          <div className="order-2 flex items-center px-[clamp(20px,6vw,128px)] py-14 md:order-1">
            <div className="max-w-[340px]">
              <h2 className="font-display text-[clamp(24px,1.9vw,32px)] leading-[1.1] tracking-[-0.02em]">{f.title}</h2>
              <p className="mt-5 text-[13px] leading-[1.6]">{f.body}</p>
              <Link href={f.cta.href} className="btn-solid mt-7 px-5 py-3.5 text-[11px]">
                {f.cta.label}
              </Link>
            </div>
          </div>
          <div className="relative order-1 aspect-[4/3] md:order-2 md:aspect-auto">
            <Image src={f.image} alt="" fill sizes="(min-width:768px) 58vw, 100vw" className="object-cover" />
          </div>
        </section>
      ))}
    </>
  );
}

export function ProductRow({
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
  return (
    <section className="section-y bg-mist">
      <div className="container-x">
        <div className="mb-[clamp(20px,2.2vw,36px)] flex items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(26px,2.2vw,38px)] leading-none tracking-[-0.02em]">{title}</h2>
          <Link href={href} className="shrink-0 border border-ink px-4 py-3 text-[11px] tracking-[0.06em] uppercase transition-colors hover:bg-ink hover:text-white">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-[clamp(8px,0.9vw,16px)] gap-y-[clamp(28px,2.6vw,44px)] lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} rating={ratings?.get(p.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DropBanner({
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
            Get notified <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <Countdown to={launchAt} className="md:justify-end" />
      </div>
    </section>
  );
}

export function JournalTeaser({ posts }: { posts: JournalPost[] }) {
  if (!posts.length) return null;
  return (
    <section className="section-y bg-bone">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Journal</p>
            <h2 className="mt-3 font-display font-normal tracking-[-0.02em] text-[clamp(28px,2.8vw,48px)] leading-none">Stories &amp; lookbooks</h2>
          </div>
          <Link href="/journal" className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase hover:underline underline-offset-4">
            Read the journal <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image src={p.cover} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: p.coverPosition ?? "center" }} />
              </div>
              <p className="mt-4 text-[11px] tracking-[0.18em] text-ash uppercase">
                {p.category} · {formatDate(p.date)}
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

export function NewsletterBand({ percentOff }: { percentOff: number }) {
  return (
    <section className="bg-mist py-[clamp(40px,4vw,72px)]">
      <div className="container-x">
        <h2 className="font-display text-[clamp(20px,1.7vw,28px)] leading-[1.2] tracking-[-0.015em]">
          Don&apos;t want to miss anything? For early drops, discounts and more, leave your email address below
        </h2>
        <div className="mt-5">
          <NewsletterForm source="home" variant="box" cta="Subscribe" />
        </div>
        {percentOff > 0 && <p className="mt-3 text-[11px] text-ash">New here? You&apos;ll get a one-time {percentOff}% code for your first order.</p>}
      </div>
    </section>
  );
}
