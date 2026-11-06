import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[1/0.78] overflow-hidden bg-stone">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-ink px-2 py-1 text-[9px] font-semibold tracking-[0.16em] text-white uppercase">
            New
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-3 sm:px-[9px]">
        <div className="min-w-0">
          <h3 className="truncate text-[10px] leading-[1.45] sm:text-[clamp(10px,0.9vw,13px)]">{product.name}</h3>
          <p className="text-[10px] leading-[1.45] sm:text-[clamp(10px,0.9vw,13px)]">{formatMoney(product.unitAmount, product.currency)}</p>
        </div>
        <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
      </div>
    </Link>
  );
}
