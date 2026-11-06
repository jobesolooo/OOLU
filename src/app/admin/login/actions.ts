"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { markEmailVerified, signIn } from "@/lib/auth";
import { checkAdminCode, CODE_TTL_MIN, isStaffEmail, issueAdminCode } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendAdminCode } from "@/lib/email";

export type CaveState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; info?: string; nonce?: number }
  | undefined;

const Email = z.string().trim().toLowerCase().email();

export async function requestCode(_: CaveState, form: FormData): Promise<CaveState> {
  const email = Email.safeParse(form.get("email"));
  if (!email.success) return { step: "email", error: "Enter a valid email." };
  const ip = await clientIp();
  if (!rateLimit(`admincode-ip:${ip}`, 10, 60 * 60_000).ok || !rateLimit(`admincode:${email.data}`, 4, 10 * 60_000).ok) {
    return { step: "email", error: "Too many codes requested. Wait a few minutes." };
  }
  // Only staff get a code — but the screen looks the same either way, so it can't be used to discover admin emails.
  if (await isStaffEmail(email.data)) {
    const code = await issueAdminCode(email.data);
    await sendAdminCode(email.data, code, CODE_TTL_MIN);
  }
  return { step: "code", email: email.data, nonce: Date.now(), info: `If ${email.data} has admin access, a 6-digit code is on its way.` };
}

export async function verifyCode(_: CaveState, form: FormData): Promise<CaveState> {
  const email = Email.safeParse(form.get("email"));
  const code = z.string().regex(/^\d{6}$/).safeParse(String(form.get("code") ?? "").replace(/\D/g, ""));
  if (!email.success) return { step: "email", error: "Start again." };
  if (!code.success) return { step: "code", email: email.data, nonce: Date.now(), error: "Enter all 6 digits." };

  const ip = await clientIp();
  if (!rateLimit(`adminverify-ip:${ip}`, 30, 15 * 60_000).ok) return { step: "code", email: email.data, nonce: Date.now(), error: "Too many attempts. Try again later." };

  const result = await checkAdminCode(email.data, code.data);
  if (!result.ok) {
    const error =
      result.reason === "invalid"
        ? "That code isn't right."
        : result.reason === "locked"
          ? "Too many wrong codes. Request a new one."
          : "That code has expired. Request a new one.";
    return { step: "code", email: email.data, nonce: Date.now(), error };
  }
  // Re-check at the moment of entry in case access was removed.
  if (!(await isStaffEmail(email.data))) return { step: "email", error: "This email doesn't have admin access." };

  const db = await getDb();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.data)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ email: email.data, name: null, passwordHash: null, emailVerifiedAt: new Date() }).returning();
  } else if (!user.emailVerifiedAt) {
    // The code arrived in their inbox, which proves the address.
    user = (await markEmailVerified(user.id)) ?? user;
  }
  await signIn(user);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

/** Single entry point for the cave form: intent=send|resend|verify|back */
export async function caveAction(prev: CaveState, form: FormData): Promise<CaveState> {
  // The clicked button's value comes last (after the hidden default), so use the last one.
  const intent = String(form.getAll("intent").at(-1) ?? "send");
  if (intent === "back") return { step: "email" };
  if (intent === "verify") return verifyCode(prev, form);
  return requestCode(prev, form);
}
