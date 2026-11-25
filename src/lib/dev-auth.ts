import "server-only";
import { eq } from "drizzle-orm";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { getDb, schema } from "./db";

/**
 * Developer access: a separate admin account for the site's developer, signed in on the normal staff
 * entrance with its own username and 6-digit code. Both live only in the hosting environment, so
 * nobody can see or change them from inside the admin, and changing the staff passcode never
 * affects them:
 *
 *   DEV_USERNAME       optional, default "dev"
 *   DEV_PASSCODE_HASH  scrypt hash of the developer's 6-digit code
 *
 * Without the hash, developer access is switched off and "dev" is just a wrong username.
 */
export const devUsername = () => (process.env.DEV_USERNAME ?? "dev").trim() || "dev";
const devHash = () => (process.env.DEV_PASSCODE_HASH ?? "").trim();

export const isDevConfigured = () => devHash().startsWith("scrypt:");

export const devEmail = () => `${devUsername().toLowerCase().replace(/[^a-z0-9]+/g, ".")}@dev.oolu`;

/** True for the developer account (only while developer access is configured). */
export const isDevAccount = (email: string | null | undefined) => isDevConfigured() && (email ?? "").toLowerCase() === devEmail();

export const isDevUsername = (username: string) => isDevConfigured() && username.trim().toLowerCase() === devUsername().toLowerCase();

/** Checks the developer code. Always hashes, so timing reveals nothing about which part was wrong. */
export function checkDevCode(code: string) {
  const [, saltHex, hashHex] = devHash().split(":");
  const actual = scryptSync(code, Buffer.from(saltHex ?? "00", "hex"), 32);
  const expected = Buffer.from(hashHex ?? "", "hex");
  return isDevConfigured() && expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** The developer's admin account (created on first sign-in). */
export async function devUser() {
  const db = await getDb();
  const email = devEmail();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ email, name: "Developer", passwordHash: null, role: "admin", emailVerifiedAt: new Date() }).returning();
  } else if (user.role !== "admin") {
    [user] = await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id)).returning();
  }
  return user;
}
