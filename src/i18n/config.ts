export const LOCALES = [
  { code: "en", label: "English", short: "EN" },
  { code: "nl", label: "Nederlands", short: "NL" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "oolu_lang";
export const isLocale = (l: string | undefined | null): l is Locale => LOCALES.some((x) => x.code === l);

/** Locale for dates and numbers. */
export const intlLocale = (l: Locale) => (l === "nl" ? "nl-NL" : "en-GB");

export type Vars = Record<string, string | number>;
export function interpolate(s: string, vars?: Vars) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s;
}
