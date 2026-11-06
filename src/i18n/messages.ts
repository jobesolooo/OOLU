import { en } from "./en";
import { nl } from "./nl";

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
export const dictionaries: Record<"en" | "nl", Messages> = { en, nl };
