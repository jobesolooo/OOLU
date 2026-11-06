import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, interpolate, isLocale, type Locale, type Vars } from "./config";
import { dictionaries, type MessageKey } from "./messages";

/** Language from the cookie; first visit falls back to the browser's Accept-Language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  // Pick the first browser language we support, e.g. "fr-BE,fr;q=0.9,en;q=0.8" → fr.
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
});

export const stripeLocale = (l: Locale) => LOCALES.find((x) => x.code === l)?.stripe ?? "en";

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const t = (key: MessageKey, vars?: Vars) => interpolate(dict[key] ?? dictionaries.en[key] ?? key, vars);
  return { t, locale };
}
