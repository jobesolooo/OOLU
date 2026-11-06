"use client";

import { create } from "zustand";

export type SessionUser = { name: string | null; email: string; image: string | null; admin: boolean };

type SessionState = {
  user: SessionUser | null;
  loaded: boolean;
  refresh: () => Promise<SessionUser | null>;
};

export const useSession = create<SessionState>()((set) => ({
  user: null,
  loaded: false,
  refresh: async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = (await res.json()) as { user: SessionUser | null };
      set({ user: data.user, loaded: true });
      return data.user;
    } catch {
      set({ loaded: true });
      return null;
    }
  },
}));
