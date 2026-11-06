import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb, schema } from "./db";
import { getSession } from "./session";
import type { OAuthProvider } from "./db/schema";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "customer" | "admin";
  emailVerified: boolean;
  hasPassword: boolean;
};

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return adminEmails().includes(email.toLowerCase());
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session.userId) return null;
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.userId)).limit(1);
  // Session was revoked (password changed, "sign out everywhere", account deleted).
  if (!user || (session.v ?? 1) !== user.sessionVersion) return null;
  // ADMIN_EMAILS always wins, so access can be granted/revoked from env vars.
  // Admin rights only apply once the email is verified (OAuth or verification link).
  const admin = isAdminEmail(user.email) && Boolean(user.emailVerifiedAt);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: admin || user.role === "admin" ? "admin" : "customer",
    emailVerified: Boolean(user.emailVerifiedAt),
    hasPassword: Boolean(user.passwordHash),
  };
});

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login`);
  if (user.role !== "admin") redirect("/admin/login?denied=1");
  return user;
}

/** Start a session for this user (call after verifying credentials). */
export async function signIn(user: { id: string; sessionVersion: number }) {
  const session = await getSession();
  session.userId = user.id;
  session.v = user.sessionVersion;
  await session.save();
}

export async function signOut() {
  const session = await getSession();
  session.destroy();
}

/** Invalidate every existing session for this user, then keep the current device signed in. */
export async function rotateSessions(userId: string, keepCurrent = true) {
  const db = await getDb();
  const [u] = await db
    .update(schema.users)
    .set({ sessionVersion: (await currentVersion(userId)) + 1 })
    .where(eq(schema.users.id, userId))
    .returning();
  if (keepCurrent && u) await signIn(u);
}

async function currentVersion(userId: string) {
  const db = await getDb();
  const [u] = await db.select({ v: schema.users.sessionVersion }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return u?.v ?? 1;
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/* ── One-time tokens (email verification, password reset) ── */
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createAuthToken(userId: string, type: "verify_email" | "reset_password", ttlMinutes: number) {
  const raw = randomBytes(32).toString("base64url");
  const db = await getDb();
  // Only the newest token of each type is valid.
  await db
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.type, type), isNull(schema.authTokens.usedAt)));
  await db.insert(schema.authTokens).values({
    userId,
    type,
    tokenHash: sha256(raw),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  });
  return raw;
}

/** Marks the token used and returns its user id, or null if invalid/expired/used. */
export async function consumeAuthToken(raw: string, type: "verify_email" | "reset_password") {
  if (!raw || raw.length > 100) return null;
  const db = await getDb();
  const [row] = await db
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.authTokens.tokenHash, sha256(raw)),
        eq(schema.authTokens.type, type),
        isNull(schema.authTokens.usedAt),
        gt(schema.authTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  return row?.userId ?? null;
}

/**
 * Attach past guest orders placed with this email to the account.
 * Only call once the email is proven to belong to the user (verified link or Google/Apple).
 */
export async function linkGuestOrders(userId: string, email: string) {
  const db = await getDb();
  const linked = await db
    .update(schema.orders)
    .set({ userId })
    .where(and(isNull(schema.orders.userId), eq(schema.orders.email, email.toLowerCase())))
    .returning({ id: schema.orders.id });
  return linked.length;
}

export async function markEmailVerified(userId: string) {
  const db = await getDb();
  const [u] = await db
    .update(schema.users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  if (u) await linkGuestOrders(u.id, u.email);
  return u ?? null;
}

export async function getLinkedProviders(userId: string): Promise<OAuthProvider[]> {
  const db = await getDb();
  const rows = await db.select({ p: schema.oauthAccounts.provider }).from(schema.oauthAccounts).where(eq(schema.oauthAccounts.userId, userId));
  return rows.map((r) => r.p);
}
