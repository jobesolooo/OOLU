"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { useWishlist, type SavedProduct } from "@/store/saved";

/**
 * Keeps the browser and the account in sync:
 * - refreshes "who am I" on navigation (header avatar)
 * - when signed in, merges the device wishlist with the account wishlist, then saves every change
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
      const merged = [...local, ...server.filter((s) => !local.some((l) => l.id === s.id))];
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
