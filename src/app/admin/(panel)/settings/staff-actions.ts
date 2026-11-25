"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, rotateSessions } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getSettings, saveSettings } from "@/lib/settings";
import { adminUsername, checkStaffCredentials, isPasscodeConfigured, setStaffGoogleEmails, setStaffPasscode, staffGoogleEmails, staffUser, weakPasscode } from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { staffInbox } from "@/lib/business";
import { sendEmail } from "@/lib/email";
import type { ActionResult } from "../actions";
import { isDevAccount } from "@/lib/dev-auth";

const GOOGLE_RESET_MINUTES = 15;
const clean = (s: string) => s.replace(/[<>&"]/g, "");

async function alertStaff(subject: string, lines: string[]) {
  const to = await staffInbox();
  if (!to) return;
  await sendEmail({
    box: "studio",
    to,
    subject,
    html: `${lines.map((l) => `<p>${l}</p>`).join("")}<p>${new Date().toUTCString()}</p><p>Not you? Sign in to the admin and change the staff passcode under Settings → Staff access.</p>`,
  });
}

/** "Continue with Google / Apple" buttons on the store. No passcode needed: it only hides or shows buttons. */
export async function saveSignInButtons(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const current = await getSettings();
  await saveSettings({ ...current, signInButtons: { google: form.get("google") === "on", apple: form.get("apple") === "on" } });
  revalidatePath("/", "layout");
  return { ok: "Saved. The sign-in page shows this straight away." };
}

/**
 * New staff passcode. Needs the current passcode, or a Google staff sign-in in the last
 * 15 minutes (for when the passcode is forgotten). Signs out every other staff session.
 */
export async function changeStaffPasscode(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const session = await getSession();
  const current = String(form.get("current") ?? "").replace(/\D/g, "");
  const next = String(form.get("next") ?? "").replace(/\D/g, "");
  const confirm = String(form.get("confirm") ?? "").replace(/\D/g, "");
  const viaGoogle = Boolean(session.googleStaffAt && Date.now() - session.googleStaffAt < GOOGLE_RESET_MINUTES * 60_000);
  const dev = isDevAccount(user.email); // developer mode can reset the staff passcode without the current one

  if (next.length !== 6) return { error: "The new passcode must be exactly 6 digits." };
  if (next !== confirm) return { error: "The two new passcodes don't match." };
  if (weakPasscode(next)) return { error: "That passcode is too easy to guess (like 111111 or 123456). Pick another." };

  if (!viaGoogle && !dev && (await isPasscodeConfigured())) {
    const ip = await clientIp();
    const perIp = rateLimit(`studio-ip:${ip}`, 5, 15 * 60_000);
    const perAccount = rateLimit(`studio-user:${adminUsername().toLowerCase()}`, 20, 60 * 60_000);
    if (!perIp.ok || !perAccount.ok) return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(perIp.retryAfter, perAccount.retryAfter) / 60)} minutes.` };
    if (!(await checkStaffCredentials(adminUsername(), current))) return { error: "The current passcode isn't right." };
    resetRateLimit(`studio-ip:${ip}`);
  }
  if (next === current) return { error: "The new passcode is the same as the current one." };

  const by = user.name || adminUsername();
  await setStaffPasscode(next, by);
  // Sign out every device on the shared staff account (keeping this one if it's the staff account itself).
  const staff = await staffUser();
  await rotateSessions(staff.id, staff.id === user.id);
  const s = await getSession();
  s.googleStaffAt = undefined;
  if (!dev) s.keysUntil = undefined;
  await s.save();
  await alertStaff("The staff passcode was changed", [`${clean(by)} changed the passcode for the OOLU studio${viaGoogle ? " after signing in with Google" : dev ? " in developer mode" : ""}. Every other device signed in as staff has been signed out.`]);
  revalidatePath("/admin/settings");
  return { ok: "Passcode changed. Use the new one from now on; other devices have been signed out." };
}

/** Google accounts allowed into the admin panel. Needs the security lock to be open. */
export async function saveStaffGoogle(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const session = await getSession();
  if (!session.keysUntil || session.keysUntil < Date.now()) return { error: "Enter the staff passcode in the security lock at the top of Settings first." };
  const emails = [...new Set(String(form.get("emails") ?? "").toLowerCase().split(/[\s,;]+/).filter(Boolean))];
  const bad = emails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (bad) return { error: `"${bad.slice(0, 80)}" isn't an email address.` };
  if (emails.length > 20) return { error: "Add at most 20 accounts." };
  const before = await staffGoogleEmails();
  await setStaffGoogleEmails(emails);
  const added = emails.filter((e) => !before.includes(e));
  const removed = before.filter((e) => !emails.includes(e));
  if (added.length || removed.length) {
    await alertStaff("Staff Google sign-in changed", [
      `${clean(user.name || adminUsername())} changed which Google accounts can open the admin panel.`,
      ...(added.length ? [`Added: ${added.map(clean).join(", ")}`] : []),
      ...(removed.length ? [`Removed: ${removed.map(clean).join(", ")}`] : []),
    ]);
  }
  revalidatePath("/admin/login");
  revalidatePath("/admin/settings");
  return { ok: emails.length ? `Saved. ${emails.length === 1 ? "This account" : `These ${emails.length} accounts`} can now use Continue with Google on the staff entrance.` : "Saved. Google sign-in for staff is off." };
}
