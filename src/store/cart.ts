"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitAmount: number;
  currency: string;
  size: string;
  quantity: number;
};

const lineKey = (l: Pick<CartLine, "productId" | "size">) => `${l.productId}|${l.size}`;
import { MAX_QTY } from "@/lib/constants";
export { MAX_QTY };

type CartState = {
  lines: CartLine[];
  open: boolean;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => lineKey(l) === lineKey(line));
          const lines = existing
            ? s.lines.map((l) =>
                lineKey(l) === lineKey(line) ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + line.quantity) } : l,
              )
            : [...s.lines, { ...line, quantity: Math.min(MAX_QTY, line.quantity) }];
          return { lines, open: true };
        }),
      setQuantity: (productId, size, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => lineKey(l) !== lineKey({ productId, size }))
              : s.lines.map((l) =>
                  lineKey(l) === lineKey({ productId, size }) ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l,
                ),
        })),
      remove: (productId, size) =>
        set((s) => ({ lines: s.lines.filter((l) => lineKey(l) !== lineKey({ productId, size })) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "wst-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity * l.unitAmount, 0);
