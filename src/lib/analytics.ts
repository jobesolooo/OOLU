import "server-only";
import { createHmac } from "node:crypto";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { EventType } from "./db/schema";

/**
 * Privacy-friendly store analytics. No cookies and no raw IP addresses are stored:
 * a visitor is a hash of IP + browser + a salt that changes every day, so someone
 * can be counted for a day but not followed from one day to the next.
 * Bots, staff, and browsers that send "Do Not Track" / "Global Privacy Control" are skipped.
 */

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|monitor|curl|wget|python|node-fetch|axios/i;

export function shouldTrack(h: Headers) {
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return false;
  if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return false;
  return true;
}

export function visitorId(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const ua = h.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.SESSION_SECRET || "oolu-analytics";
  return createHmac("sha256", secret).update(`${day}|${ip}|${ua}`).digest("base64url").slice(0, 22);
}

export function deviceOf(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "Tablet";
  if (/mobi|iphone|android/i.test(ua)) return "Mobile";
  return "Desktop";
}

const SEARCH: Record<string, string> = { google: "Google", bing: "Bing", duckduckgo: "DuckDuckGo", yahoo: "Yahoo", ecosia: "Ecosia" };
const SOCIAL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  "fb.": "Facebook",
  "t.co": "X / Twitter",
  twitter: "X / Twitter",
  "x.com": "X / Twitter",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  whatsapp: "WhatsApp",
};

/** Where a visit came from: ?utm_source / ?ref, else a friendly name for the referring site. */
export function sourceOf(url: URL, referrer: string | null, ownHost: string) {
  const tag = url.searchParams.get("utm_source") || url.searchParams.get("ref") || url.searchParams.get("source");
  let refHost: string | null = null;
  try {
    refHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : null;
  } catch {}
  if (refHost && (refHost === ownHost.replace(/^www\./, "") || refHost.endsWith(".vercel.app"))) refHost = null;
  if (tag) return { source: tag.slice(0, 40).toLowerCase(), referrer: refHost };
  if (!refHost) return { source: null, referrer: null };
  const key = (m: Record<string, string>) => Object.keys(m).find((k) => refHost!.includes(k));
  const s = key(SEARCH);
  if (s) return { source: SEARCH[s], referrer: refHost };
  const so = key(SOCIAL);
  if (so) return { source: SOCIAL[so], referrer: refHost };
  return { source: refHost, referrer: refHost };
}

export type NewEvent = {
  type: EventType;
  path: string;
  visitor: string;
  userId?: string | null;
  productId?: string | null;
  label?: string | null;
  value?: number | null;
  referrer?: string | null;
  source?: string | null;
  device?: string | null;
  country?: string | null;
};

export async function recordEvent(e: NewEvent) {
  const db = await getDb();
  await db.insert(schema.events).values({
    ...e,
    path: e.path.slice(0, 300),
    label: e.label?.slice(0, 120) ?? null,
  });
  if (e.userId) await touchUser(e.userId);
  // Keep about 13 months of history (cleaned up now and then, not on every request).
  if (Math.random() < 0.002) await db.delete(schema.events).where(lt(schema.events.at, new Date(Date.now() - 400 * 86_400_000)));
}

/** "Last active" for a customer, written at most once a minute. */
export async function touchUser(userId: string) {
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(schema.users.id, userId), or(isNull(schema.users.lastSeenAt), lt(schema.users.lastSeenAt, sql`now() - interval '1 minute'`))));
}

/** Server-side event from a request (e.g. checkout started), using the same visitor id as the browser. */
export async function recordFromRequest(h: Headers, e: Omit<NewEvent, "visitor" | "device" | "country">) {
  if (!shouldTrack(h)) return;
  await recordEvent({ ...e, visitor: visitorId(h), device: deviceOf(h.get("user-agent") ?? ""), country: h.get("x-vercel-ip-country") }).catch(() => {});
}

/** Online = did something in the last 5 minutes. */
export const ONLINE_MS = 5 * 60_000;
export const isOnline = (d: Date | string | null | undefined) => Boolean(d && Date.now() - new Date(d).getTime() < ONLINE_MS);
