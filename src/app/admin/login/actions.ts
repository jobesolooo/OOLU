"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { checkStaffCredentials, isPasscodeConfigured, staffUser, adminUsername } from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { checkDevCode, devUser, devUsername, isDevUsername } from "@/lib/dev-auth";

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
  const dev = isDevUsername(username);
  if (!dev && !(await isPasscodeConfigured())) {
    return { step: "code", username, nonce: Date.now(), error: "Staff sign-in isn't set up: add ADMIN_PASSCODE_HASH to the environment (npm run admin:passcode)." };
  }

  // 6 digits = 1,000,000 combinations, so guesses are tightly limited:
  // 5 per 15 min per network, and 20 per hour for the staff account overall.
  const ip = await clientIp();
  const perIp = rateLimit(`studio-ip:${ip}`, 5, 15 * 60_000);
  const accountKey = dev ? `studio-dev:${devUsername().toLowerCase()}` : `studio-user:${adminUsername().toLowerCase()}`;
  const perAccount = rateLimit(accountKey, 20, 60 * 60_000);
  if (!perIp.ok || !perAccount.ok) {
    const minutes = Math.ceil(Math.max(perIp.retryAfter, perAccount.retryAfter) / 60);
    return { step: "code", username, nonce: Date.now(), error: `Too many attempts. Try again in ${minutes} minutes.` };
  }

  const ok = dev ? checkDevCode(code) : await checkStaffCredentials(username, code);
  if (!ok) {
    return { step: "code", username, nonce: Date.now(), error: "Username or passcode isn't right." };
  }

  // The shared staff account, or the developer's own account; both marked admin.
  const user = dev ? await devUser() : await staffUser();
  // Correct passcode: clear the counters so normal logins never lock anyone out.
  resetRateLimit(`studio-ip:${ip}`);
  resetRateLimit(accountKey);
  await signIn(user);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}
