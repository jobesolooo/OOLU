import Image from "next/image";
import Link from "next/link";
import { isOnSale, isUpcoming, type Product } from "@/lib/catalog";
import { Price, Stars } from "./Price";
import { WishlistButton } from "./WishlistButton";
import { allVariantKeys } from "@/lib/variants";
import { getT } from "@/i18n/server";

export const toSaved = (p: Product) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  image: p.images[0] ?? null,
  unitAmount: p.unitAmount,
  compareAtAmount: p.compareAtAmount,
  currency: p.currency,
});

export async function ProductCard({
  product,
  priority = false,
  rating,
}: {
  product: Product;
  priority?: boolean;
  rating?: { average: number; count: number };
}) {
  const { t } = await getT();
  const upcoming = isUpcoming(product);
  const sale = isOnSale(product);
  const [front, back] = product.images;
  const soldOut = !upcoming && product.soldOut.length > 0 && allVariantKeys(product).every((k) => product.soldOut.includes(k));
  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone">
          {front && (
            <Image
              src={front}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover transition duration-500 group-hover:scale-[1.03] ${back ? "group-hover:opacity-0" : ""}`}
            />
          )}
          {back && (
            <Image
              src={back}
              alt=""
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {upcoming && <Badge>{t("badge.comingSoon")}</Badge>}
            {soldOut && <Badge>{t("badge.soldOut")}</Badge>}
            {!upcoming && !soldOut && sale && <Badge tone="sale">{t("badge.sale")}</Badge>}
          </div>
        </div>
        <div className="pt-3 pb-1">
          <div className="min-w-0">
            <h3 className="text-[11px] leading-[1.45] tracking-[0.04em] uppercase sm:text-[12px]">{product.name}</h3>
            <Price amount={product.unitAmount} compareAt={product.compareAtAmount} currency={product.currency} className="mt-1 text-[11px] sm:text-[12px]" />
            {rating && rating.count > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ash">
                <Stars value={rating.average} size={12} className="text-ink" /> ({rating.count})
              </p>
            )}
          </div>
        </div>
      </Link>
      <WishlistButton
        product={toSaved(product)}
        className="absolute top-2.5 right-2.5 size-10 rounded-full bg-white/85 text-ink shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] backdrop-blur-md transition-[opacity,transform,background-color,color] duration-300 hover:scale-110 hover:bg-white active:scale-95 sm:top-3 sm:right-3 sm:size-9 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [&[aria-pressed=true]]:text-[#6b54e0] [&[aria-pressed=true]]:opacity-100"
      />
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "sale" }) {
  return (
    <span
      className={`px-2 py-1 text-[10px] tracking-[0.06em] uppercase ${tone === "sale" ? "bg-accent text-white" : "bg-white text-ink"}`}
    >
      {children}
    </span>
  );
}
