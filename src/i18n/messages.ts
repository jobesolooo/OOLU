import { en } from "./en";
import { nl } from "./nl";
import { fr } from "./fr";
import { es } from "./es";
import { it } from "./it";
import { pt } from "./pt";
import type { Locale } from "./config";

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
export const dictionaries: Record<Locale, Messages> = { en, nl, fr, es, it, pt };
