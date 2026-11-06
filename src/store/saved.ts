"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Snapshot of a product, stored in the browser for wishlist + recently viewed. */
export type SavedProduct = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  unitAmount: number;
  compareAtAmount: number | null;
  currency: string;
};

type WishlistState = {
  items: SavedProduct[];
  toggle: (p: SavedProduct) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) =>
        set((s) => ({
          items: s.items.some((i) => i.id === p.id) ? s.items.filter((i) => i.id !== p.id) : [p, ...s.items].slice(0, 100),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "wst-wishlist", storage: createJSONStorage(() => localStorage) },
  ),
);

type RecentState = { items: SavedProduct[]; record: (p: SavedProduct) => void };

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      record: (p) => set((s) => ({ items: [p, ...s.items.filter((i) => i.id !== p.id)].slice(0, 12) })),
    }),
    { name: "wst-recent", storage: createJSONStorage(() => localStorage) },
  ),
);
