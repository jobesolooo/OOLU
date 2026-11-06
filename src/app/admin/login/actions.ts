"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { checkStaffCredentials, isPasscodeConfigured, staffEmail, adminUsername } from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export type StudioState =
  | { step: "username"; error?: string }
  | { step: "code"; username: string; error?: string; nonce?: number }
  | undefined;

/**
 * Step 1 only records the username (it isn't checked yet, so the screen never reveals
 * whether a username exists). Step 2 checks username + passcode together.
 */
export async function studioAction(prev: StudioState, form: FormData): Promise<StudioState> {
  const intent = String(form.getAll("intent").at(-1) ?? "username");
  if (intent === "back") return { step: "username" };

  const username = String(form.get("username") ?? "").trim().slice(0, 60);
  if (!username) return { step: "username", error: "Enter your username." };
  if (intent === "username") return { step: "code", username, nonce: Date.now() };

  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { step: "code", username, nonce: Date.now(), error: "Enter all 6 digits." };
  if (!isPasscodeConfigured()) {
    return { step: "code", username, nonce: Date.now(), error: "Staff sign-in isn't set up: add ADMIN_PASSCODE_HASH to the environment (npm run admin:passcode)." };
  }

  // 6 digits = 1,000,000 combinations, so guesses are tightly limited:
  // 5 per 15 min per network, and 20 per hour for the staff account overall.
  const ip = await clientIp();
  const perIp = rateLimit(`studio-ip:${ip}`, 5, 15 * 60_000);
  const perAccount = rateLimit(`studio-user:${adminUsername().toLowerCase()}`, 20, 60 * 60_000);
  if (!perIp.ok || !perAccount.ok) {
    const minutes = Math.ceil(Math.max(perIp.retryAfter, perAccount.retryAfter) / 60);
    return { step: "code", username, nonce: Date.now(), error: `Too many attempts. Try again in ${minutes} minutes.` };
  }

  if (!checkStaffCredentials(username, code)) {
    return { step: "code", username, nonce: Date.now(), error: "Username or passcode isn't right." };
  }

  // One staff account in the users table, marked admin.
  const db = await getDb();
  const email = staffEmail();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email, name: adminUsername(), passwordHash: null, role: "admin", emailVerifiedAt: new Date() })
      .returning();
  } else if (user.role !== "admin") {
    [user] = await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id)).returning();
  }
  // Correct passcode: clear the counters so normal logins never lock anyone out.
  resetRateLimit(`studio-ip:${ip}`);
  resetRateLimit(`studio-user:${adminUsername().toLowerCase()}`);
  await signIn(user);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}
