import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, interpolate, isLocale, type Locale, type Vars } from "./config";
import { dictionaries, type MessageKey } from "./messages";

/** Language from the cookie; first visit falls back to the browser's Accept-Language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^nl\b|,\s*nl\b/i.test(accept) ? "nl" : DEFAULT_LOCALE;
});

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const t = (key: MessageKey, vars?: Vars) => interpolate(dict[key] ?? dictionaries.en[key] ?? key, vars);
  return { t, locale };
}
