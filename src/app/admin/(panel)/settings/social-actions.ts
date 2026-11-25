"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getSettings, saveSettings } from "@/lib/settings";
import type { ActionResult } from "../actions";

/** Uploads one feed photo: resized to max 1080 px, saved as WebP in the database. Returns its address. */
export async function uploadSocialPhoto(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = form.get("photo");
  if (!(file instanceof File) || !file.size) return { error: "Choose a photo first." };
  if (file.size > 15 * 1024 * 1024) return { error: "That photo is over 15 MB. Try a smaller one." };
  try {
    const out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const db = await getDb();
    const [row] = await db
      .insert(schema.media)
      .values({ mime: "image/webp", data: out.data.toString("base64"), width: out.info.width, height: out.info.height })
      .returning({ id: schema.media.id });
    return { url: `/api/media/${row.id}` };
  } catch (err) {
    console.error("[social] upload failed", err);
    return { error: "That file couldn't be read as a photo." };
  }
}

const IG = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/i;
const TT = /^https:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/\S+$/i;

export async function saveSocialFeed(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const current = await getSettings();
  let posts: { url: string; image: string }[] = [];
  try {
    posts = JSON.parse(String(form.get("instagram") ?? "[]"));
  } catch {
    return { error: "Couldn't read the Instagram posts. Reload the page and try again." };
  }
  const instagram = posts
    .map((p) => ({ url: String(p.url ?? "").trim(), image: String(p.image ?? "").trim() }))
    .filter((p) => p.image.startsWith("/api/media/") || p.image.startsWith("/images/"))
    .slice(0, 12);
  const badIg = instagram.find((p) => p.url && !IG.test(p.url));
  if (badIg) return { error: `This isn't an Instagram post link: ${badIg.url}` };
  const tiktok = String(form.get("tiktok") ?? "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const badTt = tiktok.find((u) => !TT.test(u));
  if (badTt) return { error: `This isn't a TikTok link: ${badTt}` };
  await saveSettings({ ...current, social: { enabled: form.get("socialEnabled") === "on", instagram, tiktok } });
  revalidatePath("/", "layout");
  return { ok: "Social feed saved" };
}
