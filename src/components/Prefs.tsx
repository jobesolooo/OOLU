"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { interpolate, intlLocale, type Locale, type Vars } from "@/i18n/config";
import type { MessageKey, Messages } from "@/i18n/messages";
import { formatDisplay, type CurrencyCode, type Rates } from "@/lib/currency";
import { MESSAGE_PATTERNS } from "@/i18n/server-messages";

type Prefs = { locale: Locale; messages: Messages; currency: CurrencyCode; rates: Rates };
const Ctx = createContext<Prefs | null>(null);

/** Language + display currency, read from cookies on the server and handed to client components. */
export function PrefsProvider({ children, ...value }: Prefs & { children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("PrefsProvider missing");
  return v;
}

export function useT() {
  const { messages } = usePrefs();
  return useCallback((key: MessageKey, vars?: Vars) => interpolate(messages[key] ?? key, vars), [messages]);
}

/** Translate an English message that came back from a server action or API route. */
export function useTx() {
  const t = useT();
  return useCallback(
    (text: string | null | undefined) => {
      if (!text) return text ?? "";
      for (const [re, key, names] of MESSAGE_PATTERNS) {
        const m = text.match(re);
        if (m) return t(key, Object.fromEntries((names ?? []).map((n, i) => [n, m[i + 1]])));
      }
      return text;
    },
    [t],
  );
}

export function useLocale() {
  return usePrefs().locale;
}

/** Formats money in the shopper's display currency (≈ when not EUR). */
export function useMoney() {
  const { currency, rates, locale } = usePrefs();
  return useMemo(
    () => ({
      currency,
      isBase: currency === "EUR",
      money: (cents: number, from = "EUR", short = false) => formatDisplay(cents, from, currency, rates, { short }),
      date: (d: Date | string | number) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(d)),
    }),
    [currency, rates, locale],
  );
}

export function setPreference(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
