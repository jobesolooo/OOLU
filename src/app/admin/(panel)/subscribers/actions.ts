"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { addSubscriber, deleteAlert, deleteSubscriber, resendWelcome, setSubscriberActive, updateSubscriberEmail } from "@/lib/admin-subscribers";
import type { ActionResult } from "../actions";

const Email = z.string().trim().toLowerCase().email();
const refresh = () => revalidatePath("/admin/subscribers");

export async function addSubscribers(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  // One or many: separated by commas, spaces or new lines (pasting a column from a sheet works).
  const raw = String(form.get("emails") ?? "")
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (!raw.length) return { error: "Enter at least one email." };
  if (raw.length > 500) return { error: "Up to 500 at a time." };
  const bad = raw.filter((e) => !Email.safeParse(e).success);
  if (bad.length) return { error: `Not valid: ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? ` +${bad.length - 3} more` : ""}` };
  const welcome = form.get("welcome") === "on";
  const tally = { added: 0, resubscribed: 0, exists: 0 };
  for (const e of [...new Set(raw.map((x) => x.toLowerCase()))]) tally[await addSubscriber(e, { welcome })]++;
  refresh();
  const parts = [tally.added && `${tally.added} added`, tally.resubscribed && `${tally.resubscribed} re-subscribed`, tally.exists && `${tally.exists} already on the list`].filter(Boolean);
  return { ok: parts.join(" · ") + (welcome && tally.added ? " · welcome emails sent" : "") };
}

export async function saveSubscriber(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  const email = Email.safeParse(form.get("email"));
  if (!id.success) return { error: "Invalid subscriber" };
  if (!email.success) return { error: "Enter a valid email." };
  try {
    await updateSubscriberEmail(id.data, email.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save" };
  }
  refresh();
  redirect("/admin/subscribers?saved=1");
}

export async function subscriberAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const action = z.enum(["unsubscribe", "resubscribe", "delete", "welcome", "deleteAlert"]).parse(form.get("action"));
  if (action === "delete") await deleteSubscriber(id);
  else if (action === "deleteAlert") await deleteAlert(id);
  else if (action === "welcome") await resendWelcome(id);
  else await setSubscriberActive(id, action === "resubscribe");
  refresh();
}
