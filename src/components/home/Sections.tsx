import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { site } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export function CategoryTiles() {
  return (
    <section className="bg-bone pt-[18px] pb-6">
      <div className="container-x grid grid-cols-2 gap-[13px] lg:grid-cols-4">
        {site.categories.map((c) => (
          <Link key={c.label} href={c.href} className="group relative block aspect-[226/180] overflow-hidden bg-ink text-white">
            <Image
              src={c.image}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-[9%] left-[7%]">
              <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase sm:text-[clamp(12px,1.25vw,17px)]">{c.label}</h3>
              <p className="mt-1.5 flex items-center gap-2 text-[10px] sm:text-[clamp(10px,0.95vw,13px)]">
                Shop Now <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
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
        <Image src={drops.image} alt="" fill sizes="70vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ebeae6] via-[#ebeae6]/10 to-transparent md:via-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#ebeae6]/85 to-transparent" />
      </div>

      <div className="container-x grid min-h-[420px] grid-cols-1 items-center gap-10 py-12 md:min-h-[clamp(300px,29vw,520px)] md:grid-cols-[1fr_1fr] md:py-0">
        <div>
          <p className="text-[10px] font-medium tracking-[0.3em] uppercase md:text-[clamp(10px,1.08vw,14px)]">{drops.eyebrow}</p>
          <h2 className="mt-4 font-display text-[44px] leading-[0.92] font-[900] uppercase md:text-[clamp(38px,4.05vw,64px)]">
            {drops.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="mt-5 text-[13px] leading-[1.45] md:text-[clamp(12px,1.22vw,17px)]">
            {drops.body.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <Link href={drops.cta.href} className="btn-solid mt-6 md:px-[clamp(20px,2vw,30px)] md:py-[clamp(10px,1.1vw,15px)]">
            {drops.cta.label}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="hidden justify-self-end md:block md:mr-[1%]">
          <p className="text-[clamp(12px,1.27vw,18px)] leading-[1.6] font-medium tracking-[0.3em] uppercase">
            {drops.aside.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <span className="mt-[clamp(14px,1.8vw,24px)] block h-px w-12 bg-ink" />
          <p className="mt-2 -rotate-[14deg] font-script text-[clamp(40px,4.6vw,72px)] leading-none" aria-label={site.name}>
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
      <div className="container-x grid grid-cols-2 gap-x-4 gap-y-6 py-7 md:grid-cols-4 md:py-[clamp(24px,2.9vw,40px)]">
        {site.perks.map((p) => {
          const Icon = PERK_ICONS[p.icon];
          return (
            <div key={p.title} className="flex items-center gap-4 md:justify-center md:gap-[clamp(16px,2.2vw,30px)] md:first:justify-start">
              <Icon className="size-7 shrink-0 md:size-[clamp(26px,3vw,38px)]" strokeWidth={1.1} />
              <div>
                <p className="text-[9.5px] font-semibold tracking-[0.12em] uppercase md:text-[clamp(9px,0.86vw,12px)]">{p.title}</p>
                <p className="mt-1 text-[10px] md:text-[clamp(9px,0.86vw,12px)]">{p.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-mist pt-7 pb-6 md:pt-[clamp(24px,2.6vw,40px)]">
      <div className="container-x">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-medium tracking-[0.3em] uppercase md:text-[clamp(11px,1.1vw,15px)]">Featured products</h2>
          <Link href="/shop" className="flex items-center gap-2 text-[9px] tracking-[0.14em] uppercase md:text-[clamp(9px,0.8vw,11px)]">
            View all <ArrowRight className="size-3" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-[16px] sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
