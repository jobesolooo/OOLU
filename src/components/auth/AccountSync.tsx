"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { useWishlist, type SavedProduct } from "@/store/saved";
import { PENDING_WISH } from "@/components/WishlistButton";

/**
 * Keeps the browser and the account in sync:
 * - refreshes "who am I" on navigation (header avatar)
 * - when signed in, merges the device wishlist with the account wishlist (plus the piece a guest
 *   tapped the heart on before signing in), then saves every change. The wishlist needs an account.
 */
export function AccountSync() {
  const pathname = usePathname();
  const refresh = useSession((s) => s.refresh);
  const email = useSession((s) => s.user?.email ?? null);
  const syncedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // Merge once per signed-in user.
  useEffect(() => {
    if (!email) {
      // Signed out on this device → don't leave the account's wishlist behind.
      if (syncedFor.current) useWishlist.setState({ items: [] });
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === email) return;
    syncedFor.current = email;
    (async () => {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (!res.ok) return;
      const { items: server } = (await res.json()) as { items: SavedProduct[] };
      const local = useWishlist.getState().items;
      let merged = [...local, ...server.filter((s) => !local.some((l) => l.id === s.id))];
      // The piece they tapped the heart on before signing in.
      try {
        const raw = sessionStorage.getItem(PENDING_WISH);
        sessionStorage.removeItem(PENDING_WISH);
        const pending = raw ? (JSON.parse(raw) as SavedProduct) : null;
        if (pending?.id && !merged.some((m) => m.id === pending.id)) merged = [pending, ...merged];
      } catch {}
      useWishlist.setState({ items: merged });
      if (merged.length !== server.length) {
        await fetch("/api/wishlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: merged.map((i) => i.id) }) });
      }
    })();
  }, [email]);

  // Save changes while signed in.
  useEffect(() => {
    return useWishlist.subscribe((state, prev) => {
      if (!syncedFor.current || state.items === prev.items) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fetch("/api/wishlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: state.items.map((i) => i.id) }),
        });
      }, 400);
    });
  }, []);

  return null;
}
