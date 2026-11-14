import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Staff sign-in: one permanent username + a 6-digit passcode, or Google for the
 * accounts listed in Admin → Settings → Staff access.
 *
 * The passcode is never stored in plain text, only as an scrypt hash. The first one comes from
 * ADMIN_PASSCODE_HASH (generate with `npm run admin:passcode`); once staff change it in
 * Settings, the new hash lives in the database and takes priority.
 */
export const adminUsername = () => (process.env.ADMIN_USERNAME ?? "Janna").trim();

const ROW = "staff-auth";
type StaffAuth = { passcodeHash?: string; changedAt?: string; changedBy?: string; googleEmails?: string[] };

async function readStaffAuth(): Promise<StaffAuth> {
  try {
    const db = await getDb();
    const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, ROW)).limit(1);
    return (r?.value ?? {}) as StaffAuth;
  } catch {
    return {};
  }
}

async function writeStaffAuth(patch: Partial<StaffAuth>) {
  const next = { ...(await readStaffAuth()), ...patch };
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: ROW, value: next })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: next, updatedAt: new Date() } });
}

const currentHash = async () => (await readStaffAuth()).passcodeHash || process.env.ADMIN_PASSCODE_HASH || "";

export const isPasscodeConfigured = async () => (await currentHash()).startsWith("scrypt:");

function matches(passcode: string, stored: string) {
  const [, saltHex, hashHex] = stored.split(":");
  const actual = scryptSync(passcode, Buffer.from(saltHex ?? "00", "hex"), 32);
  const expected = Buffer.from(hashHex ?? "", "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function checkStaffCredentials(username: string, passcode: string) {
  const stored = await currentHash();
  // Always run the hash, even for a wrong username, so timing doesn't reveal which part was wrong.
  const codeOk = matches(passcode, stored);
  const nameOk = username.trim().toLowerCase() === adminUsername().toLowerCase();
  return stored.startsWith("scrypt:") && codeOk && nameOk;
}

/** Codes that are too easy to guess. */
export function weakPasscode(code: string) {
  return /^(\d)\1+$/.test(code) || "0123456789".includes(code) || "9876543210".includes(code) || /^(\d\d)\1\1$/.test(code) || /^(\d{3})\1$/.test(code);
}

export async function setStaffPasscode(code: string, by: string) {
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString("hex")}:${scryptSync(code, salt, 32).toString("hex")}`;
  await writeStaffAuth({ passcodeHash: hash, changedAt: new Date().toISOString(), changedBy: by });
}

export async function staffPasscodeInfo() {
  const a = await readStaffAuth();
  return { source: a.passcodeHash ? ("settings" as const) : process.env.ADMIN_PASSCODE_HASH ? ("host" as const) : ("none" as const), changedAt: a.changedAt ?? null, changedBy: a.changedBy ?? null };
}

/** Google accounts that may open the admin panel with "Continue with Google". */
export async function staffGoogleEmails() {
  return (await readStaffAuth()).googleEmails ?? [];
}

export async function setStaffGoogleEmails(emails: string[]) {
  await writeStaffAuth({ googleEmails: emails });
}

/** Internal email for the staff account (never receives mail). */
export const staffEmail = () => `${adminUsername().toLowerCase().replace(/[^a-z0-9]+/g, ".")}@staff.oolu`;

/** The one staff account in the users table (created on first sign-in), marked admin. */
export async function staffUser() {
  const db = await getDb();
  const email = staffEmail();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ email, name: adminUsername(), passwordHash: null, role: "admin", emailVerifiedAt: new Date() }).returning();
  } else if (user.role !== "admin") {
    [user] = await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id)).returning();
  }
  return user;
}
