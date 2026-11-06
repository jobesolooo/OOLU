import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isOnSale, isUpcoming, type Product } from "@/lib/catalog";
import { Price, Stars } from "./Price";
import { WishlistButton } from "./WishlistButton";

export const toSaved = (p: Product) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  image: p.images[0] ?? null,
  unitAmount: p.unitAmount,
  compareAtAmount: p.compareAtAmount,
  currency: p.currency,
});

export function ProductCard({
  product,
  priority = false,
  rating,
}: {
  product: Product;
  priority?: boolean;
  rating?: { average: number; count: number };
}) {
  const upcoming = isUpcoming(product);
  const sale = isOnSale(product);
  const [front, back] = product.images;
  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[1/0.9] overflow-hidden bg-stone">
          {front && (
            <Image
              src={front}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              className={`object-contain transition duration-500 group-hover:scale-[1.03] ${back ? "group-hover:opacity-0" : ""}`}
            />
          )}
          {back && (
            <Image
              src={back}
              alt=""
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {upcoming && <Badge>Coming soon</Badge>}
            {!upcoming && sale && <Badge tone="sale">Sale</Badge>}
            {!upcoming && !sale && product.isNew && <Badge>New</Badge>}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 px-1 pt-4 pb-2">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] leading-snug font-medium sm:text-[14px]">{product.name}</h3>
            <Price amount={product.unitAmount} compareAt={product.compareAtAmount} currency={product.currency} className="mt-1 text-[13px] sm:text-[14px]" />
            {rating && rating.count > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ash">
                <Stars value={rating.average} size={12} className="text-ink" /> ({rating.count})
              </p>
            )}
          </div>
          <ArrowRight className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
        </div>
      </Link>
      <WishlistButton
        product={toSaved(product)}
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [&[aria-pressed=true]]:opacity-100"
      />
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "sale" }) {
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${
        tone === "sale" ? "bg-[#a3271b] text-white" : "bg-ink text-white"
      }`}
    >
      {children}
    </span>
  );
}
