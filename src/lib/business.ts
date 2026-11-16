import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { site } from "./site";
import type { BizKey } from "./business-catalog";
import { getKey } from "./keys";

/**
 * Business details (name, company info, contact, socials, shipping & returns),
 * edited in Admin → Settings and read everywhere on the site and in emails.
 * Every server re-reads them at most every few seconds, so a change is live almost at once.
 */

const ROW = "business";
const TTL_MS = 5_000;

export const DEFAULT_COUNTRIES = [
  "US", "CA", "GB", "IE", "NL", "BE", "DE", "FR", "ES", "IT", "PT", "AT", "CH", "DK", "SE", "NO", "FI",
  "PL", "CZ", "LU", "AU", "NZ", "JP", "SG", "AE",
];

export type BizValues = Partial<Record<BizKey, string>>;

export type Business = {
  name: string;
  /** null = use the translated tagline */
  tagline: string | null;
  /** null = use the translated description */
  description: string | null;
  legalName: string;
  address: string;
  kvk: string;
  vat: string;
  email: string;
  phone: string;
  /** null = use the translated default */
  city: string | null;
  hours: string | null;
  social: { instagram: string | null; tiktok: string | null };
  handles: { instagram: string | null; tiktok: string | null };
  freeShippingThreshold: number; // cents
  flatRate: number; // cents
  countries: string[];
  returnDays: number;
  returnAddress: string;
  /** e.g. "ooluclothing.com": the shop's addresses are made on this domain */
  emailDomain: string;
  /** Staff inbox that receives forwarded mail and alerts ("" = not set) */
  forwardTo: string;
  /** Search Console / Bing verification tokens ("" = not set) */
  googleVerify: string;
  bingVerify: string;
};

const envNum = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return process.env[name] && Number.isFinite(n) ? n : fallback;
};

/** What each field falls back to when it's left empty (also shown as the placeholder). */
export function bizDefaults(): Record<BizKey, string> {
  return {
    name: site.name,
    tagline: "",
    description: "",
    legalName: "",
    address: "",
    kvk: "",
    vat: "",
    email: "",
    phone: "",
    city: "",
    hours: "",
    instagram: site.social.instagram,
    tiktok: site.social.tiktok,
    freeShippingFrom: String(envNum("FREE_SHIPPING_THRESHOLD", 10000) / 100),
    flatRate: String(envNum("FLAT_SHIPPING_RATE", 800) / 100),
    countries: (process.env.SHIPPING_COUNTRIES || DEFAULT_COUNTRIES.join(", ")).replace(/\s*,\s*/g, ", "),
    returnDays: String(envNum("RETURN_WINDOW_DAYS", 30)),
    returnAddress: process.env.RETURN_ADDRESS ?? "",
    emailDomain: "ooluclothing.com",
    forwardTo: process.env.ORDER_NOTIFICATION_EMAIL ?? "",
    googleVerify: process.env.GOOGLE_SITE_VERIFICATION ?? "",
    bingVerify: process.env.BING_SITE_VERIFICATION ?? "",
  };
}

/** "https://www.instagram.com/oolu___oolu/" → "@oolu___oolu" */
function handleOf(url: string | null) {
  if (!url) return null;
  const last = url.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
  return last ? `@${last.replace(/^@/, "")}` : url;
}

/** Accepts the bare code or the whole <meta name=... content="..."> tag. */
const token = (raw: string) => (raw.match(/content=["']([^"']+)["']/i)?.[1] ?? raw).replace(/[^\w.:=-]/g, "");

function resolve(saved: BizValues): Business {
  const d = bizDefaults();
  // A saved empty string means "hidden" for socials, "default" for everything else.
  const v = (k: BizKey) => (saved[k]?.trim() ? saved[k]!.trim() : d[k]);
  const social = (k: "instagram" | "tiktok") => (k in saved ? saved[k]?.trim() || null : d[k] || null);
  const cents = (k: BizKey, fallback: number) => {
    const n = Number(v(k).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : fallback;
  };
  const domain = v("emailDomain").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "") || "ooluclothing.com";
  const days = Number(v("returnDays"));
  const countries = v("countries")
    .split(/[\s,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  const s = { instagram: social("instagram"), tiktok: social("tiktok") };
  return {
    name: v("name"),
    tagline: v("tagline") || null,
    description: v("description") || null,
    legalName: v("legalName"),
    address: v("address"),
    kvk: v("kvk"),
    vat: v("vat"),
    email: v("email") || `hello@${domain}`,
    phone: v("phone"),
    city: v("city") || null,
    hours: v("hours") || null,
    social: s,
    handles: { instagram: handleOf(s.instagram), tiktok: handleOf(s.tiktok) },
    freeShippingThreshold: cents("freeShippingFrom", 10000),
    flatRate: cents("flatRate", 800),
    countries: countries.length ? countries : DEFAULT_COUNTRIES,
    returnDays: Number.isInteger(days) && days > 0 ? days : 30,
    returnAddress: v("returnAddress"),
    emailDomain: domain,
    forwardTo: v("forwardTo"),
    googleVerify: token(v("googleVerify")),
    bingVerify: token(v("bingVerify")),
  };
}

const g = globalThis as unknown as { __oolu_biz?: { at: number; saved: BizValues; biz: Business } };

/** What staff have saved (only the fields they filled in). */
export async function getSavedBusiness(fresh = false): Promise<BizValues> {
  const hit = g.__oolu_biz;
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.saved;
  try {
    const db = await getDb();
    const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, ROW)).limit(1);
    const saved = (r?.value ?? {}) as BizValues;
    g.__oolu_biz = { at: Date.now(), saved, biz: resolve(saved) };
    return saved;
  } catch (err) {
    console.error("[business] couldn't read saved details, using defaults", err);
    return hit?.saved ?? {};
  }
}

/** The details in use right now. */
export async function getBusiness(): Promise<Business> {
  await getSavedBusiness();
  return g.__oolu_biz?.biz ?? resolve({});
}

/** Last details loaded on this server (call getBusiness() first in the same request). */
export function biz(): Business {
  return g.__oolu_biz?.biz ?? resolve({});
}

export async function saveBusiness(values: BizValues) {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: ROW, value: values })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: values, updatedAt: new Date() } });
  g.__oolu_biz = { at: Date.now(), saved: values, biz: resolve(values) };
}

/** Company details for the legal pages; anything not filled in yet stays a visible [placeholder]. */
export async function legalCompany() {
  const { COMPANY } = await import("@/content/legal");
  const b = await getBusiness();
  return {
    name: b.legalName || COMPANY.name,
    tradeName: b.name,
    address: b.address || COMPANY.address,
    kvk: b.kvk || COMPANY.kvk,
    vat: b.vat || COMPANY.vat,
    email: b.email || COMPANY.email,
    phone: b.phone || COMPANY.phone,
  };
}

/** Where staff alerts and forwarded customer mail go: the inbox set in Business details. */
export async function staffInbox() {
  const b = await getBusiness();
  return b.forwardTo || (await getKey("ORDER_NOTIFICATION_EMAIL")) || null;
}
