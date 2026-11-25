import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { site } from "./site";

export type StoreSettings = {
  announcement: string;
  dropBanner: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
    launchAt: string | null; // ISO; null = use the next upcoming product release
    href: string;
  };
  popup: { enabled: boolean; percentOff: number; delaySeconds: number };
  /** Gift card amounts sold on /gift-cards, in cents */
  giftCardAmounts: number[];
  /** Which "Continue with …" buttons customers see (they also need their keys in Account keys). */
  signInButtons: { google: boolean; apple: boolean };
  /** Christmas theme: snow in the hero, holiday copy and a gift card band. Switches itself off after `until`. */
  holiday: { enabled: boolean; until: string | null; title: string; message: string };
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: site.announcement,
  dropBanner: {
    enabled: true,
    eyebrow: "Next drop",
    title: "The next OOLU drop",
    body: "Limited run, made in Amsterdam. Get notified before everyone else.",
    launchAt: null,
    href: "/drops",
  },
  popup: { enabled: true, percentOff: 10, delaySeconds: 12 },
  giftCardAmounts: [2500, 5000, 10000, 15000, 25000],
  signInButtons: { google: true, apple: true },
  holiday: { enabled: true, until: "2026-12-26T23:00:00.000Z", title: "", message: "" },
};

/** Whether the Christmas theme shows right now (switched on and not past its end date). */
export const holidayActive = (s: StoreSettings, now: number) =>
  s.holiday.enabled && (!s.holiday.until || Date.parse(s.holiday.until) > now);

export async function getSettings(): Promise<StoreSettings> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "store")).limit(1);
    const saved = (row?.value ?? {}) as Partial<StoreSettings>;
    // Settings saved before the OOLU rebrand still carry the old Wstablished copy.
    if (saved.announcement && /\$\d|wstablished/i.test(saved.announcement)) delete saved.announcement;
    if (saved.dropBanner?.title === "Essentials Vol. 1") saved.dropBanner = { ...saved.dropBanner, title: DEFAULT_SETTINGS.dropBanner.title };
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      dropBanner: { ...DEFAULT_SETTINGS.dropBanner, ...saved.dropBanner },
      popup: { ...DEFAULT_SETTINGS.popup, ...saved.popup },
      signInButtons: { ...DEFAULT_SETTINGS.signInButtons, ...saved.signInButtons },
      holiday: { ...DEFAULT_SETTINGS.holiday, ...saved.holiday },
      giftCardAmounts: saved.giftCardAmounts?.length ? saved.giftCardAmounts : DEFAULT_SETTINGS.giftCardAmounts,
    };
  } catch (err) {
    console.error("[settings] falling back to defaults", err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: StoreSettings) {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: "store", value: next })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: next, updatedAt: new Date() } });
}
