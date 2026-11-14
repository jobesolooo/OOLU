"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { BIZ_GROUPS, type BizKey } from "@/lib/business-catalog";
import { saveBusiness, type BizValues } from "@/lib/business";
import type { ActionResult } from "../actions";

const checks: Partial<Record<BizKey, (v: string) => string | null>> = {
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
  await requireAdmin();
  const next: BizValues = {};
  for (const f of BIZ_GROUPS.flatMap((g) => g.fields)) {
    const raw = String(form.get(f.name) ?? "").replace(/\r\n/g, "\n").trim().slice(0, f.max ?? 300);
    if (raw) {
      const problem = checks[f.name]?.(raw);
      if (problem) return { error: problem };
      next[f.name] = f.name === "countries" ? raw.split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase()).join(", ") : raw;
    } else if (f.name === "instagram" || f.name === "tiktok") {
      next[f.name] = ""; // empty social link = hide it
    }
  }
  await saveBusiness(next);
  // Live: every page and email picks up the new details on its next request.
  revalidatePath("/", "layout");
  return { ok: "Business details saved. Live on the site now." };
}
