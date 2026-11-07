"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import {
  consumeAuthToken,
  createAuthToken,
  getCurrentUser,
  getLinkedProviders,
  hashPassword,
  markEmailVerified,
  rotateSessions,
  signIn,
  signOut,
  verifyPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendPasswordReset, sendSecurityNotice, sendVerifyEmail, sendWelcome } from "@/lib/email";
import { OAUTH_PROVIDERS } from "@/lib/db/schema";

export type FormState = { error?: string; ok?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
};

const Password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use a mix of letters and numbers");

/* ── Sign up ─────────────────────────────────────────────── */
const Register = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: Password,
  newsletter: z.string().optional(),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 10, 60 * 60_000).ok) return { error: "Too many sign-ups from this network. Try again later." };
  const parsed = Register.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  const { name, email, password, newsletter } = parsed.data;

  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id, hasPw: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) {
    return {
      error: exists.hasPw
        ? "An account with that email already exists. Try signing in."
        : "That email is already registered with Google or Apple. Use that button to sign in.",
    };
  }

  const [user] = await db
    .insert(schema.users)
    // Admin rights come from ADMIN_EMAILS at request time, and only once the email is confirmed.
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning();

  if (newsletter === "on") {
    await db.insert(schema.subscribers).values({ email, source: "signup" }).onConflictDoNothing();
  }

  await signIn(user);
  await sendVerifyEmail(email, await createAuthToken(user.id, "verify_email", 24 * 60));
  await sendWelcome(email, name);
  redirect(`${safeNext(form.get("next"))}${safeNext(form.get("next")).includes("?") ? "&" : "?"}welcome=1`);
}

/* ── Sign in ─────────────────────────────────────────────── */
const Login = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Login.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const byIp = rateLimit(`login-ip:${ip}`, 30, 15 * 60_000);
  const byEmail = rateLimit(`login:${email}`, 8, 15 * 60_000);
  if (!byIp.ok || !byEmail.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(byIp.retryAfter, byEmail.retryAfter) / 60)} minutes, or reset your password.` };
  }

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (user && !user.passwordHash) {
    const providers = await getLinkedProviders(user.id);
    const names = providers.map((p) => (p === "google" ? "Google" : "Apple")).join(" or ");
    return { error: `This account uses ${names || "social"} sign-in. Use that button above, or reset your password to add one.` };
  }
  if (!user || !(await verifyPassword(password, user.passwordHash!))) {
    return { error: "Email or password is incorrect." };
  }
  await signIn(user);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await signOut();
  redirect("/");
}

/* ── Email verification ──────────────────────────────────── */
export async function resendVerification(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (user.emailVerified) return { ok: "Your email is already confirmed." };
  if (!rateLimit(`verify:${user.id}`, 3, 60 * 60_000).ok) return { error: "We've sent a few already — check your spam folder." };
  await sendVerifyEmail(user.email, await createAuthToken(user.id, "verify_email", 24 * 60));
  return { ok: `Sent a new link to ${user.email}.` };
}

export async function verifyEmailToken(token: string) {
  const userId = await consumeAuthToken(token, "verify_email");
  if (!userId) return false;
  await markEmailVerified(userId);
  return true;
}

/* ── Forgot / reset password ─────────────────────────────── */
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email." };
  const ip = await clientIp();
  if (!rateLimit(`reset-ip:${ip}`, 10, 60 * 60_000).ok || !rateLimit(`reset:${email.data}`, 3, 60 * 60_000).ok) {
    return { error: "Too many requests. Try again later." };
  }
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.data)).limit(1);
  if (user) await sendPasswordReset(user.email, await createAuthToken(user.id, "reset_password", 60));
  // Same answer whether or not the account exists.
  return { ok: "If there's an account for that email, a reset link is on its way. It expires in 1 hour." };
}

const Reset = z.object({ token: z.string().min(10).max(100), password: Password, confirm: z.string() }).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
});

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Reset.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const userId = await consumeAuthToken(parsed.data.token, "reset_password");
  if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };
  const db = await getDb();
  const [user] = await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.password), emailVerifiedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  // Clicking the emailed link proves the address, so verify it and attach guest orders.
  await markEmailVerified(userId);
  // Sign out every other device, sign in here.
  await rotateSessions(user.id, false);
  const [fresh] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  await signIn(fresh);
  await sendSecurityNotice(user.email, "Your password was just reset.");
  redirect("/account?reset=1");
}

/* ── Profile & security (signed in) ──────────────────────── */
async function me() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?next=/account");
  return user;
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const name = z.string().trim().min(1, "Enter your name").max(80).safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0]?.message };
  const db = await getDb();
  await db.update(schema.users).set({ name: name.data }).where(eq(schema.users.id, user.id));
  revalidatePath("/account", "layout");
  return { ok: "Saved" };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const parsed = z
    .object({ current: z.string().optional(), password: Password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords don't match" })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (row.passwordHash) {
    if (!rateLimit(`pw:${user.id}`, 6, 15 * 60_000).ok) return { error: "Too many attempts. Try again later." };
    if (!parsed.data.current || !(await verifyPassword(parsed.data.current, row.passwordHash))) return { error: "Current password is incorrect." };
  }
  await db.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(schema.users.id, user.id));
  await rotateSessions(user.id); // other devices get signed out
  await sendSecurityNotice(user.email, row.passwordHash ? "Your password was changed." : "A password was added to your account.");
  revalidatePath("/account", "layout");
  return { ok: row.passwordHash ? "Password changed. Other devices were signed out." : "Password added. You can now sign in with email too." };
}

export async function disconnectProvider(form: FormData) {
  const user = await me();
  const provider = z.enum(OAUTH_PROVIDERS).parse(form.get("provider"));
  const providers = await getLinkedProviders(user.id);
  // Never leave an account without a way to sign in.
  if (!user.hasPassword && providers.length <= 1) redirect("/account/security?error=last_login_method");
  const db = await getDb();
  await db.delete(schema.oauthAccounts).where(and(eq(schema.oauthAccounts.userId, user.id), eq(schema.oauthAccounts.provider, provider)));
  await sendSecurityNotice(user.email, `${provider === "google" ? "Google" : "Apple"} sign-in was disconnected from your account.`);
  revalidatePath("/account", "layout");
  redirect("/account/security?disconnected=1");
}

export async function signOutEverywhere() {
  const user = await me();
  await rotateSessions(user.id, false);
  await signOut();
  redirect("/account/login?signedout=1");
}

export async function setNewsletter(form: FormData) {
  const user = await me();
  const on = form.get("on") === "true";
  const db = await getDb();
  const [existing] = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, user.email)).limit(1);
  if (on) {
    if (existing) await db.update(schema.subscribers).set({ unsubscribedAt: null }).where(eq(schema.subscribers.id, existing.id));
    else await db.insert(schema.subscribers).values({ email: user.email, source: "account" });
  } else if (existing) {
    await db.update(schema.subscribers).set({ unsubscribedAt: new Date() }).where(eq(schema.subscribers.id, existing.id));
  }
  revalidatePath("/account", "layout");
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  if (String(form.get("confirmDelete") ?? "").trim().toUpperCase() !== "DELETE") return { error: 'Type "DELETE" to confirm.' };
  if (user.role === "admin") return { error: "Admin accounts can't be deleted here. Remove the email from ADMIN_EMAILS first." };
  const db = await getDb();
  // Orders are kept for tax records (detached from the account); everything personal is removed.
  await db.update(schema.orders).set({ userId: null }).where(eq(schema.orders.userId, user.id));
  await db.update(schema.subscribers).set({ unsubscribedAt: new Date() }).where(and(eq(schema.subscribers.email, user.email), isNull(schema.subscribers.unsubscribedAt)));
  await db.delete(schema.users).where(eq(schema.users.id, user.id)); // cascades: oauth, tokens, wishlist; reviews keep first name only
  await signOut();
  redirect("/?deleted=1");
}
