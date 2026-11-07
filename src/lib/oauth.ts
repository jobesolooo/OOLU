import "server-only";
import { Apple, Google } from "arctic";
import { sealData, unsealData } from "iron-session";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { OAuthProvider } from "./db/schema";
import { isAdminEmail, linkGuestOrders } from "./auth";
import { siteUrl } from "@/lib/site-url";

export const callbackUrl = (p: OAuthProvider) => `${siteUrl()}/api/auth/${p}/callback`;

export function isProviderConfigured(p: OAuthProvider) {
  if (p === "google") return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
}

export function google() {
  return new Google(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!, callbackUrl("google"));
}

/** APPLE_PRIVATE_KEY is the contents of the .p8 file (PEM). "\n" escapes are accepted. */
function applePkcs8() {
  const pem = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function apple() {
  return new Apple(process.env.APPLE_CLIENT_ID!, process.env.APPLE_TEAM_ID!, process.env.APPLE_KEY_ID!, applePkcs8(), callbackUrl("apple"));
}

/* ── Short-lived, encrypted cookie that carries the OAuth state across the redirect ── */
export const OAUTH_COOKIE = "wst_oauth";
export type OAuthFlow = { provider: OAuthProvider; state: string; verifier?: string; next: string; linkUserId?: string };

const secret = () => process.env.SESSION_SECRET!;
export const sealFlow = (f: OAuthFlow) => sealData(f, { password: secret(), ttl: 600 });
export async function unsealFlow(v: string | undefined) {
  if (!v) return null;
  try {
    const f = await unsealData<OAuthFlow>(v, { password: secret(), ttl: 600 });
    return f?.state ? f : null;
  } catch {
    return null;
  }
}

export const safeNext = (v: string | null | undefined) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/account");

export type OAuthProfile = {
  provider: OAuthProvider;
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
};

export type OAuthResult =
  | { ok: true; user: typeof schema.users.$inferSelect; created: boolean; linked: boolean }
  | { ok: false; error: string };

/**
 * Find or create the account for a Google/Apple profile.
 * 1. Already connected → sign in.
 * 2. Linking from account settings → attach to the signed-in user.
 * 3. Same verified email as an existing account → attach to it (and sign in).
 * 4. Otherwise → create a new account.
 */
export async function resolveOAuthUser(profile: OAuthProfile, linkUserId?: string): Promise<OAuthResult> {
  const db = await getDb();
  const email = profile.email?.toLowerCase() ?? null;

  const [existing] = await db
    .select({ user: schema.users })
    .from(schema.oauthAccounts)
    .innerJoin(schema.users, eq(schema.users.id, schema.oauthAccounts.userId))
    .where(and(eq(schema.oauthAccounts.provider, profile.provider), eq(schema.oauthAccounts.providerUserId, profile.sub)))
    .limit(1);

  if (linkUserId) {
    if (existing && existing.user.id !== linkUserId) {
      return { ok: false, error: `That ${label(profile.provider)} account is already connected to a different OOLU account.` };
    }
    if (!existing) {
      await db.insert(schema.oauthAccounts).values({ provider: profile.provider, providerUserId: profile.sub, userId: linkUserId, email });
    }
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, linkUserId)).limit(1);
    if (!user) return { ok: false, error: "Account not found." };
    return { ok: true, user, created: false, linked: !existing };
  }

  if (existing) return { ok: true, user: existing.user, created: false, linked: false };

  if (!email) return { ok: false, error: `${label(profile.provider)} didn't share an email address. Try another sign-in method.` };
  if (!profile.emailVerified) return { ok: false, error: `Your ${label(profile.provider)} email isn't verified yet.` };

  const [byEmail] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (byEmail) {
    await db.insert(schema.oauthAccounts).values({ provider: profile.provider, providerUserId: profile.sub, userId: byEmail.id, email });
    const [user] = await db
      .update(schema.users)
      .set({
        emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
        name: byEmail.name ?? profile.name,
        image: byEmail.image ?? profile.image,
      })
      .where(eq(schema.users.id, byEmail.id))
      .returning();
    await linkGuestOrders(user.id, user.email);
    return { ok: true, user, created: false, linked: true };
  }

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      name: profile.name,
      image: profile.image,
      passwordHash: null,
      emailVerifiedAt: new Date(),
      role: isAdminEmail(email) ? "admin" : "customer",
    })
    .returning();
  await db.insert(schema.oauthAccounts).values({ provider: profile.provider, providerUserId: profile.sub, userId: user.id, email });
  await linkGuestOrders(user.id, email);
  return { ok: true, user, created: true, linked: true };
}

export const label = (p: OAuthProvider) => (p === "google" ? "Google" : "Apple");
