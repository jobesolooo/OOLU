"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { BIZ_GROUPS, type BizKey } from "@/lib/business-catalog";
import { getBusiness, getSavedBusiness, saveBusiness, type BizValues } from "@/lib/business";
import { sendEmail } from "@/lib/email";
import { setUpEmail } from "@/lib/mail-setup";
import { getSession } from "@/lib/session";
import { adminUsername } from "@/lib/admin-auth";
import type { ActionResult } from "../actions";

const esc = (s: string) => s.replace(/[&<>"]/g, "");

const checks: Partial<Record<BizKey, (v: string) => string | null>> = {
  emailDomain: (v) => (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")) ? null : "Email domain should look like ooluclothing.shop."),
  forwardTo: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Forward mail to: that doesn't look like an email address."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Customer service email doesn't look like an email address."),
  phone: (v) => (/^[+\d][\d\s()-]{5,}$/.test(v) ? null : "Phone number can only contain digits, spaces, +, - and brackets."),
  instagram: (v) => (/^https:\/\/(www\.)?instagram\.com\/[^\s]+$/i.test(v) ? null : "Instagram link should look like https://www.instagram.com/yourname/"),
  tiktok: (v) => (/^https:\/\/(www\.)?tiktok\.com\/@[^\s]+$/i.test(v) ? null : "TikTok link should look like https://www.tiktok.com/@yourname"),
  freeShippingFrom: (v) => (/^\d+([.,]\d{1,2})?$/.test(v) ? null : "Free shipping from: enter an amount like 100 or 99.95."),
  flatRate: (v) => (/^\d+([.,]\d{1,2})?$/.test(v) ? null : "Shipping cost: enter an amount like 8 or 7.50."),
  returnDays: (v) => (/^\d+$/.test(v) && +v >= 1 && +v <= 365 ? null : "Return window: enter a number of days between 1 and 365."),
  countries: (v) => {
    const codes = v.split(/[\s,]+/).filter(Boolean);
    const bad = codes.filter((c) => !/^[a-z]{2}$/i.test(c));
    return bad.length ? `Ship to countries: "${bad[0]}" isn't a two-letter country code.` : null;
  },
};

export async function saveBusinessDetails(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  // Each form only sends its own fields; everything else stays as it was.
  const before = await getSavedBusiness(true);
  const oldInbox = (await getBusiness()).forwardTo;
  const next: BizValues = { ...before };
  for (const f of BIZ_GROUPS.flatMap((g) => g.fields)) {
    if (!form.has(f.name)) continue;
    delete next[f.name];
    const raw = String(form.get(f.name) ?? "").replace(/\r\n/g, "\n").trim().slice(0, f.max ?? 300);
    if (raw) {
      const problem = checks[f.name]?.(raw);
      if (problem) return { error: problem };
      next[f.name] = f.name === "countries" ? raw.split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase()).join(", ") : raw;
    } else if (f.name === "instagram" || f.name === "tiktok") {
      next[f.name] = ""; // empty social link = hide it
    }
  }
  if (next.emailDomain) next.emailDomain = next.emailDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  await saveBusiness(next);

  // Changing where customer mail goes is sensitive: tell the old inbox.
  const newInbox = (await getBusiness()).forwardTo;
  if (oldInbox && newInbox !== oldInbox) {
    await sendEmail({
      box: "studio",
      to: oldInbox,
      subject: "Shop email is now forwarded to a different inbox",
      html: `<p>${esc(user.name || adminUsername())} changed where the shop's incoming mail is forwarded:</p><p>${esc(oldInbox)} → <strong>${esc(newInbox || "nowhere")}</strong></p><p>${new Date().toUTCString()}</p><p>Not expected? Sign in to the admin, check Settings → Business details → Email addresses, and change the staff passcode.</p>`,
    });
  }
  // Live: every page and email picks up the new details on its next request.
  revalidatePath("/", "layout");
  return { ok: "Business details saved. Live on the site now." };
}

/** "Set up email": connects the domain to Resend and turns on incoming mail. Needs the passcode unlock, like keys. */
export async function setUpEmailAction(_prev: ActionResult): Promise<ActionResult> { // eslint-disable-line @typescript-eslint/no-unused-vars
  const user = await requireAdmin();
  const session = await getSession();
  if (!session.keysUntil || session.keysUntil < Date.now()) return { error: "Unlock editing under Account keys with the staff passcode first." };
  const res = await setUpEmail(user.name || adminUsername());
  revalidatePath("/admin/settings");
  return res;
}
