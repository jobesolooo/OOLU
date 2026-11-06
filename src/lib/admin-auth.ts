import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { isAdminEmail } from "./auth";

export const CODE_TTL_MIN = 10;
export const MAX_ATTEMPTS = 5;

const hmac = (email: string, code: string) =>
  createHmac("sha256", process.env.SESSION_SECRET!).update(`admin:${email}:${code}`).digest("hex");

/** Staff = listed in ADMIN_EMAILS, or an account already marked admin in the database. */
export async function isStaffEmail(email: string) {
  if (isAdminEmail(email)) return true;
  const db = await getDb();
  const [u] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return u?.role === "admin";
}

/** Creates a fresh 6-digit code (older unused codes for this email stop working). */
export async function issueAdminCode(email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const db = await getDb();
  await db
    .update(schema.adminCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.adminCodes.email, email), isNull(schema.adminCodes.usedAt)));
  await db.insert(schema.adminCodes).values({
    email,
    codeHash: hmac(email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
  });
  return code;
}

export type CodeCheck = { ok: true } | { ok: false; reason: "invalid" | "expired" | "locked" };

/** Checks a code. Each wrong guess counts; after MAX_ATTEMPTS the code is burned. */
export async function checkAdminCode(email: string, code: string): Promise<CodeCheck> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.adminCodes)
    .where(and(eq(schema.adminCodes.email, email), isNull(schema.adminCodes.usedAt), gt(schema.adminCodes.expiresAt, new Date())))
    .orderBy(desc(schema.adminCodes.createdAt))
    .limit(1);
  if (!row) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  const a = Buffer.from(row.codeHash, "hex");
  const b = Buffer.from(hmac(email, code), "hex");
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    const [u] = await db
      .update(schema.adminCodes)
      .set({ attempts: sql`${schema.adminCodes.attempts} + 1` })
      .where(eq(schema.adminCodes.id, row.id))
      .returning({ attempts: schema.adminCodes.attempts });
    if (u.attempts >= MAX_ATTEMPTS) await db.update(schema.adminCodes).set({ usedAt: new Date() }).where(eq(schema.adminCodes.id, row.id));
    return { ok: false, reason: u.attempts >= MAX_ATTEMPTS ? "locked" : "invalid" };
  }
  await db.update(schema.adminCodes).set({ usedAt: new Date() }).where(eq(schema.adminCodes.id, row.id));
  return { ok: true };
}
