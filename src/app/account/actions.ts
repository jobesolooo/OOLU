"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword, isAdminEmail, verifyPassword } from "@/lib/auth";
import { sendWelcome } from "@/lib/email";

export type FormState = { error?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
};

const Register = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Register.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  const { name, email, password } = parsed.data;

  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) return { error: "An account with that email already exists. Try signing in." };

  const [user] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await hashPassword(password), role: isAdminEmail(email) ? "admin" : "customer" })
    .returning();

  // Guest orders are deliberately NOT linked by email here: without email
  // verification, anyone could register with someone else's address.

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  await sendWelcome(email, name);
  redirect(safeNext(form.get("next")));
}

const Login = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Login.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
