"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import {
  createStripeProduct,
  deleteStripeProduct,
  importDemoCatalogue,
  setStripeProductActive,
  updateStripeProduct,
  ensureStripeImages,
  uploadProductImage,
  type ProductInput,
} from "@/lib/stripe-products";
import { slugify } from "@/lib/catalog";

export type ProductFormState = { ok?: string; error?: string; field?: string } | undefined;

const money = (label: string, required: boolean) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => (required ? v !== "" : true), `${label} is required`)
    .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0), `${label} must be an amount like 49 or 49.95`);

const Form = z.object({
  name: z.string().trim().min(2, "Give the product a name").max(250),
  description: z.string().trim().max(5000).default(""),
  price: money("Price", true),
  compareAt: money("Original price", false),
  slug: z.string().trim().max(120).default(""),
  category: z.string().trim().min(1, "Pick a category").max(60),
  collection: z.string().trim().max(60).default(""),
  sizes: z.string().trim().max(200).default(""),
  group: z.string().trim().max(80).default(""),
  color: z.string().trim().max(40).default(""),
  colorHex: z
    .string()
    .trim()
    .refine((v) => v === "" || /^#[0-9a-f]{6}$/i.test(v), "Swatch colour must look like #151515")
    .default(""),
  sort: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,4}$/.test(v), "Order must be a whole number")
    .default(""),
  releaseAt: z.string().trim().default(""),
  details: z.string().max(3000).default(""),
  colors: z.string().default("[]"),
  images: z.string().default("[]"),
});

const ColorList = z.array(z.object({ name: z.string().trim().min(1).max(30), hex: z.string().regex(/^#[0-9a-f]{6}$/i) })).max(12);
const ImageList = z.array(z.string().url()).max(8);

/** Amsterdam wall-clock "2026-12-01T18:00" → ISO with the right offset (CET/CEST). */
function amsterdamToIso(local: string) {
  const asUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asUtc)) return null;
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", timeZoneName: "shortOffset" })
    .formatToParts(asUtc)
    .find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT+1"
  const hours = Number(tzName?.replace("GMT", "") || 0);
  return new Date(asUtc - hours * 3_600_000).toISOString();
}

function parse(form: FormData): { input?: ProductInput; error?: string; field?: string } {
  const r = Form.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) {
    const issue = r.error.issues[0];
    return { error: issue?.message ?? "Check the form", field: String(issue?.path[0] ?? "") };
  }
  const d = r.data;
  const colors = ColorList.safeParse(JSON.parse(d.colors || "[]"));
  if (!colors.success) return { error: "Each colour needs a name and a #hex value", field: "colors" };
  const images = ImageList.safeParse(JSON.parse(d.images || "[]"));
  if (!images.success) return { error: "Up to 8 photos, each a full https:// link", field: "images" };
  const release = d.releaseAt ? amsterdamToIso(d.releaseAt) : "";
  if (release === null) return { error: "Release date isn't a valid date", field: "releaseAt" };
  const price = Math.round(Number(d.price) * 100);
  const compareAt = d.compareAt ? Math.round(Number(d.compareAt) * 100) : 0;
  if (compareAt && compareAt <= price) return { error: "Original price should be higher than the price (it shows as a sale)", field: "compareAt" };
  const sizes = d.sizes
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "one size");

  return {
    input: {
      name: d.name,
      description: d.description,
      unitAmount: price,
      images: images.data,
      active: form.get("active") === "on",
      metadata: {
        slug: slugify(d.slug || d.name),
        category: slugify(d.category),
        collection: slugify(d.collection),
        sizes: [...new Set(sizes)].join(","),
        featured: form.get("featured") === "on" ? "true" : "",
        new: form.get("isNew") === "on" ? "true" : "",
        sort: d.sort,
        group: slugify(d.group),
        color: d.color,
        color_hex: d.color ? d.colorHex : "",
        compare_at: compareAt ? (compareAt / 100).toFixed(2) : "",
        release_at: release,
        details: d.details
          .split("\n")
          .map((l) => l.replace(/\|/g, "/").trim())
          .filter(Boolean)
          .slice(0, 12)
          .join("|"),
        colors: colors.data.map((c) => `${c.name.replace(/[|:]/g, "")}:${c.hex}`).join("|"),
        variants: "",
      },
    },
  };
}

function stripeError(err: unknown) {
  console.error("[admin/products]", err);
  return err instanceof Error ? `Stripe said: ${err.message}` : "Stripe didn't accept that. Try again.";
}

function refresh(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/", "layout");
}

export async function saveProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  if (!isStripeConfigured()) return { error: "Connect Stripe first (Settings → Stripe)." };
  const id = String(form.get("id") ?? "");
  const { input, error, field } = parse(form);
  if (!input) return { error, field };
  let newId: string | null = null;
  try {
    // Photos pasted from other sites are copied into Stripe so the store can always show them.
    input.images = await ensureStripeImages(input.images);
    if (id) await updateStripeProduct(id, input);
    else newId = (await createStripeProduct(input)).id;
  } catch (err) {
    return { error: stripeError(err) };
  }
  refresh(id || undefined);
  if (newId) redirect(`/admin/products/${newId}?created=1`);
  return { ok: "Saved to Stripe · live on the store" };
}

export async function toggleProductActive(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(form.get("id"));
  await setStripeProductActive(id, form.get("active") === "true");
  refresh(id);
}

export async function removeProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(form.get("id"));
  const result = await deleteStripeProduct(id);
  refresh();
  redirect(`/admin/products?${result === "deleted" ? "deleted=1" : "archived=1"}`);
}

export async function uploadPhoto(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  if (!isStripeConfigured()) return { error: "Connect Stripe first." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { error: "No file received." };
  if (!/^image\/(jpeg|png|webp|avif|heic|heif)$/.test(file.type)) return { error: "Use a JPG, PNG, WebP or HEIC photo." };
  if (file.size > 20_000_000) return { error: "Photo is over 20 MB." };
  try {
    return { url: await uploadProductImage(Buffer.from(await file.arrayBuffer()), file.name) };
  } catch (err) {
    return { error: stripeError(err) };
  }
}

export async function importCatalogue(): Promise<ProductFormState> {
  await requireAdmin();
  if (!isStripeConfigured()) return { error: "Connect Stripe first." };
  try {
    const { created, skipped } = await importDemoCatalogue();
    refresh();
    return { ok: `Copied ${created} product${created === 1 ? "" : "s"} to Stripe${skipped ? ` · ${skipped} already there` : ""}` };
  } catch (err) {
    return { error: stripeError(err) };
  }
}
