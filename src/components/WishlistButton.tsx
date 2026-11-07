"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useWishlist, type SavedProduct } from "@/store/saved";
import { useSession } from "@/store/session";
import { useMounted } from "@/lib/use-mounted";
import { cx } from "@/lib/format";
import { useT } from "./Prefs";

/** Product remembered while a signed-out shopper signs in; added to the wishlist afterwards (see AccountSync). */
export const PENDING_WISH = "oolu-pending-wish";

export function WishlistButton({ product, className, label = false }: { product: SavedProduct; className?: string; label?: boolean }) {
  const t = useT();
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const toggle = useWishlist((s) => s.toggle);
  const signedIn = useSession((s) => Boolean(s.user));
  const saved = useWishlist((s) => s.items.some((i) => i.id === product.id)) && mounted && signedIn;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t("wishlist.removeAria", { name: product.name }) : t("wishlist.addAria", { name: product.name })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // The wishlist lives on the account, so saving asks a guest to sign in first.
        const session = useSession.getState();
        void (async () => {
          const user = session.loaded ? session.user : await session.refresh();
          if (user) return toggle(product);
          try {
            sessionStorage.setItem(PENDING_WISH, JSON.stringify(product));
          } catch {}
          const here = `${pathname}${window.location.search}`;
          router.push(`/account/login?reason=wishlist&next=${encodeURIComponent(here)}`);
        })();
      }}
      className={cx("inline-flex items-center justify-center gap-2", className)}
    >
      {/* key re-mounts the icon on change so the pop plays each time it's toggled */}
      <Heart
        key={String(saved)}
        className={cx("size-[18px] shrink-0 transition-colors", saved && "animate-pop fill-current")}
        strokeWidth={1.5}
        aria-hidden
      />
      {label && <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{saved ? t("wishlist.saved") : t("wishlist.save")}</span>}
    </button>
  );
}
