export const LOCALES = [
  { code: "en", label: "English", short: "EN", intl: "en-GB", stripe: "en" },
  { code: "nl", label: "Nederlands", short: "NL", intl: "nl-NL", stripe: "nl" },
  { code: "fr", label: "Français", short: "FR", intl: "fr-FR", stripe: "fr" },
  { code: "es", label: "Español", short: "ES", intl: "es-ES", stripe: "es" },
  { code: "it", label: "Italiano", short: "IT", intl: "it-IT", stripe: "it" },
  { code: "pt", label: "Português", short: "PT", intl: "pt-PT", stripe: "pt" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "oolu_lang";
export const isLocale = (l: string | undefined | null): l is Locale => LOCALES.some((x) => x.code === l);

/** Locale for dates and numbers. */
export const intlLocale = (l: Locale) => LOCALES.find((x) => x.code === l)?.intl ?? "en-GB";

export type Vars = Record<string, string | number>;
export function interpolate(s: string, vars?: Vars) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s;
}
