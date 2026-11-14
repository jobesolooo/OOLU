"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { adminUsername, checkStaffCredentials, isPasscodeConfigured } from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { KEY_DEFS, KEY_GROUPS } from "@/lib/keys-catalog";
import { clearKey, saveKey, turnOffKey } from "@/lib/keys";
import { stripeClient } from "@/lib/stripe";
import { invalidateCatalog } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { getBusiness, staffInbox } from "@/lib/business";

export type KeysResult = { ok?: string; error?: string; warn?: string; at?: number } | undefined;

const UNLOCK_MINUTES = 10;

/** Changing keys can redirect payments, so it needs the staff passcode again, then stays open for 10 minutes. */
export async function unlockKeys(_: KeysResult, form: FormData): Promise<KeysResult> {
  await requireAdmin();
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter all 6 digits." };
  if (!isPasscodeConfigured()) return { error: "The staff passcode isn't set up (ADMIN_PASSCODE_HASH), so keys can't be unlocked." };

  const ip = await clientIp();
  const perIp = rateLimit(`studio-ip:${ip}`, 5, 15 * 60_000);
  const perAccount = rateLimit(`studio-user:${adminUsername().toLowerCase()}`, 20, 60 * 60_000);
  if (!perIp.ok || !perAccount.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(perIp.retryAfter, perAccount.retryAfter) / 60)} minutes.` };
  }
  if (!checkStaffCredentials(adminUsername(), code)) return { error: "That passcode isn't right." };
  resetRateLimit(`studio-ip:${ip}`);

  const session = await getSession();
  session.keysUntil = Date.now() + UNLOCK_MINUTES * 60_000;
  await session.save();
  revalidatePath("/admin/settings");
  return { ok: `Unlocked for ${UNLOCK_MINUTES} minutes.`, at: Date.now() };
}

export async function lockKeys() {
  await requireAdmin();
  const session = await getSession();
  session.keysUntil = undefined;
  await session.save();
  revalidatePath("/admin/settings");
}

async function stripeCheck(key: string): Promise<KeysResult> {
  if (process.env.STRIPE_MOCK_URL) return undefined;
  try {
    await stripeClient(key).balance.retrieve();
    return undefined;
  } catch (err) {
    if (err instanceof Stripe.errors.StripeAuthenticationError) return { error: "Stripe says this secret key isn't valid. Copy it again from Stripe → Developers → API keys." };
    if (err instanceof Stripe.errors.StripePermissionError) return undefined; // restricted key without balance access: still fine
    return { warn: "Saved, but Stripe couldn't be reached to double-check the key." };
  }
}

/**
 * One form per group. The pressed button decides what happens:
 *   save        → store every field that was filled in (empty fields stay as they are)
 *   clear:NAME  → remove the value saved here (the host's value takes over, if it has one)
 *   off:NAME    → switch it off even though the host has a value
 *   on:NAME     → undo "off"
 */
export async function changeKeys(_: KeysResult, form: FormData): Promise<KeysResult> {
  const user = await requireAdmin();
  const session = await getSession();
  if (!session.keysUntil || session.keysUntil < Date.now()) return { error: "Editing is locked. Enter the staff passcode first." };

  const group = KEY_GROUPS.find((g) => g.id === form.get("group"));
  if (!group) return { error: "Unknown section." };
  const intent = String(form.get("intent") ?? "save");
  const by = user.name || adminUsername();
  const changed: string[] = [];
  let warn: string | undefined;

  if (intent === "save") {
    const updates: [string, string][] = [];
    for (const def of group.keys) {
      let value = String(form.get(def.name) ?? "").trim();
      if (!value) continue;
      if (def.multiline) value = value.replace(/\r\n/g, "\n");
      if (def.pattern && !new RegExp(def.pattern.re).test(value)) return { error: `${def.label}: ${def.pattern.message}` };
      updates.push([def.name, value]);
    }
    if (!updates.length) return { error: "Nothing to save: fill in at least one field." };

    const stripeKey = updates.find(([n]) => n === "STRIPE_SECRET_KEY")?.[1];
    if (stripeKey) {
      const check = await stripeCheck(stripeKey);
      if (check?.error) return check;
      warn = check?.warn;
    }
    for (const [name, value] of updates) {
      await saveKey(name, value, by);
      changed.push(`${KEY_DEFS[name].label} saved`);
    }
  } else {
    const [op, name] = intent.split(":");
    const def = group.keys.find((k) => k.name === name);
    if (!def || !["clear", "off", "on"].includes(op)) return { error: "Unknown action." };
    if (op === "off") await turnOffKey(name, by);
    else await clearKey(name);
    changed.push(`${def.label} ${op === "off" ? "turned off" : op === "on" ? "turned back on" : "removed"}`);
  }

  // Live: every page re-renders with the new keys; the catalogue re-reads Stripe on its next visit.
  if (group.id === "stripe") invalidateCatalog();
  revalidatePath("/", "layout");

  // A heads-up to the shop's inbox, so an unexpected change never goes unnoticed.
  const to = await staffInbox();
  if (to) {
    await sendEmail({
      box: "studio",
      to,
      subject: `${(await getBusiness()).name}: account keys changed (${group.title})`,
      html: `<p>${by.replace(/[<>&"]/g, "")} changed account keys in the admin panel:</p><ul>${changed.map((c) => `<li>${group.title}: ${c}</li>`).join("")}</ul><p>${new Date().toUTCString()}</p><p>Not you? Sign in to the admin, check Settings → Account keys, and change the staff passcode.</p>`,
    });
  }

  const ok = `${changed.join(", ")}. Live now.`;
  return warn ? { ok, warn, at: Date.now() } : { ok, at: Date.now() };
}
