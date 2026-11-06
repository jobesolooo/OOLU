"use client";

import { Heart } from "lucide-react";
import { useWishlist, type SavedProduct } from "@/store/saved";
import { useMounted } from "@/lib/use-mounted";
import { cx } from "@/lib/format";

export function WishlistButton({ product, className, label = false }: { product: SavedProduct; className?: string; label?: boolean }) {
  const mounted = useMounted();
  const toggle = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.items.some((i) => i.id === product.id)) && mounted;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      className={cx("inline-flex items-center gap-2", className)}
    >
      <Heart className={cx("size-[18px] transition-colors", saved && "fill-current")} strokeWidth={1.5} />
      {label && <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
