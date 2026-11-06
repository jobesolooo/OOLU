import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { site } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import type { JournalPost } from "@/content/journal";
import { formatDate } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { NewsletterForm } from "@/components/Newsletter";

export function CategoryTiles() {
  return (
    <section className="bg-bone pt-[clamp(18px,2vw,32px)] pb-[clamp(24px,2.6vw,44px)]">
      <div className="container-x grid grid-cols-2 gap-[clamp(10px,1.3vw,22px)] lg:grid-cols-4">
        {site.categories.map((c) => (
          <Link key={c.label} href={c.href} className="group relative block aspect-[226/180] overflow-hidden bg-ink text-white">
            <Image
              src={c.image}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-[9%] left-[7%]">
              <h3 className="text-[13px] font-semibold tracking-[0.16em] uppercase sm:text-[clamp(13px,1.3vw,20px)]">{c.label}</h3>
              <p className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-[clamp(11px,0.95vw,14px)]">
                Shop Now <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FreshDrops() {
  const { drops } = site;
  return (
    <section className="relative isolate overflow-hidden bg-[#ebeae6]">
      <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[69%]">
        <Image src={drops.image} alt="" fill sizes="70vw" className="object-cover object-[30%_center] md:object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ebeae6] via-[#ebeae6]/40 to-transparent md:hidden" />
      </div>

      <div className="container-x grid min-h-[460px] grid-cols-1 items-center gap-10 py-14 md:min-h-[clamp(340px,29vw,600px)] md:grid-cols-[1fr_1fr] md:py-0">
        <div>
          <p className="eyebrow">{drops.eyebrow}</p>
          <h2 className="h-display mt-4">
            {drops.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="mt-6 text-[15px] leading-[1.5] md:text-[clamp(14px,1.2vw,19px)]">
            {drops.body.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <Link href={drops.cta.href} className="btn-solid mt-8">
            {drops.cta.label}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="hidden justify-self-end md:mr-[1%] md:block">
          <p className="text-[clamp(13px,1.27vw,20px)] leading-[1.6] font-medium tracking-[0.3em] uppercase">
            {drops.aside.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <span className="mt-[clamp(14px,1.8vw,28px)] block h-px w-14 bg-ink" />
          <p className="mt-2 -rotate-[14deg] font-script text-[clamp(44px,4.8vw,84px)] leading-none" aria-label={site.name}>
            {site.name}
          </p>
        </div>
      </div>
    </section>
  );
}

const PERK_ICONS = { truck: Truck, shield: ShieldCheck, returns: RefreshCw, leaf: Leaf } as const;

export function Perks() {
  return (
    <section className="border-b border-black/5 bg-mist">
      <div className="container-x grid grid-cols-2 gap-x-4 gap-y-8 py-10 md:grid-cols-4 md:py-[clamp(32px,3.4vw,56px)]">
        {site.perks.map((p) => {
          const Icon = PERK_ICONS[p.icon];
          return (
            <div key={p.title} className="flex items-center gap-4 md:justify-center md:gap-[clamp(16px,1.8vw,28px)] md:first:justify-start md:last:justify-end">
              <Icon className="size-8 shrink-0 md:size-[clamp(30px,2.8vw,44px)]" strokeWidth={1.1} />
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase md:text-[clamp(11px,0.9vw,14px)]">{p.title}</p>
                <p className="mt-1 text-[12px] md:text-[clamp(11px,0.9vw,14px)]">{p.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
        <div className="mb-8 flex items-end justify-between">
          <h2 className="eyebrow">{title}</h2>
          <Link href={href} className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase hover:underline underline-offset-4">
            View all <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-[clamp(12px,1.4vw,24px)] gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
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
            <h2 className="mt-3 font-display text-[clamp(28px,2.8vw,48px)] leading-none font-[900] uppercase">Stories &amp; lookbooks</h2>
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
              <h3 className="mt-2 text-xl font-semibold group-hover:underline underline-offset-4">{p.title}</h3>
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
    <section className="section-y bg-mist">
      <div className="container-x grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">Join the movement</p>
          <h2 className="h-display mt-4">
            {percentOff}% off your
            <br />
            first order
          </h2>
        </div>
        <div className="max-w-lg md:justify-self-end">
          <p className="mb-6 text-[15px] leading-relaxed text-black/75">
            Early access to every drop, restock alerts and stories from the West Side. Sign up and we&apos;ll send a one-time code.
          </p>
          <NewsletterForm source="home" cta="Get my code" />
        </div>
      </div>
    </section>
  );
}
