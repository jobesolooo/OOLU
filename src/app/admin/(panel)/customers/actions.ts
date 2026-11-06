"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createAccount,
  deleteAccount,
  emailTaken,
  sendReset,
  sendVerification,
  setSubscribed,
  signOutEverywhere,
  updateAccount,
} from "@/lib/admin-users";
import type { ActionResult } from "../actions";

const Fields = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

const refresh = (id?: string) => {
  revalidatePath("/admin/customers");
  if (id) revalidatePath(`/admin/customers/${id}`);
};

export async function createCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const f = Fields.safeParse(Object.fromEntries(form));
  if (!f.success) return { error: f.error.issues[0]?.message };
  if (await emailTaken(f.data.email)) return { error: "There's already an account with that email." };
  const { user, invited } = await createAccount({
    email: f.data.email,
    name: f.data.name || null,
    verified: form.get("verified") === "on",
    invite: form.get("invite") === "on",
    staff: form.get("staff") === "on",
  });
  refresh();
  redirect(`/admin/customers/${user.id}?created=1${form.get("invite") === "on" && !invited ? "&invite=failed" : ""}`);
}

export async function saveCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  const f = Fields.safeParse(Object.fromEntries(form));
  if (!id.success) return { error: "Invalid account" };
  if (!f.success) return { error: f.error.issues[0]?.message };
  if (await emailTaken(f.data.email, id.data)) return { error: "Another account already uses that email." };
  const staff = form.get("staff") === "on";
  if (id.data === me.id && !staff) return { error: "You can't remove your own staff access." };
  try {
    await updateAccount(id.data, { email: f.data.email, name: f.data.name || null, verified: form.get("verified") === "on", staff });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save" };
  }
  refresh(id.data);
  return { ok: "Saved" };
}

/** One-click account tools: reset email, verification email, sign out everywhere, newsletter. */
export async function customerTool(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid account" };
  const tool = String(form.get("tool"));
  try {
    switch (tool) {
      case "reset":
        await sendReset(id.data);
        return { ok: "Password reset email sent" };
      case "verify":
        await sendVerification(id.data);
        return { ok: "Confirmation email sent" };
      case "signout":
        await signOutEverywhere(id.data);
        refresh(id.data);
        return { ok: "Signed out on every device" };
      case "subscribe":
      case "unsubscribe":
        await setSubscribed(String(form.get("email")), tool === "subscribe");
        refresh(id.data);
        revalidatePath("/admin/subscribers");
        return { ok: tool === "subscribe" ? "Added to the newsletter" : "Removed from the newsletter" };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
  return { error: "Unknown action" };
}

export async function removeCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  if (id === me.id) redirect(`/admin/customers/${id}?error=self`);
  try {
    await deleteAccount(id);
  } catch {
    redirect(`/admin/customers/${id}?error=protected`);
  }
  refresh();
  redirect("/admin/customers?deleted=1");
}
