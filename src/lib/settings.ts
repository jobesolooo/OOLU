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
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: site.announcement,
  dropBanner: {
    enabled: true,
    eyebrow: "Next drop",
    title: "Essentials Vol. 1",
    body: "Limited run. Sign up to get the link before everyone else.",
    launchAt: null,
    href: "/drops",
  },
  popup: { enabled: true, percentOff: 10, delaySeconds: 12 },
};

export async function getSettings(): Promise<StoreSettings> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "store")).limit(1);
    const saved = (row?.value ?? {}) as Partial<StoreSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      dropBanner: { ...DEFAULT_SETTINGS.dropBanner, ...saved.dropBanner },
      popup: { ...DEFAULT_SETTINGS.popup, ...saved.popup },
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
