import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type Stripe from "stripe";
import sharp from "sharp";
import { getStripe, stripeDashboardUrl } from "./stripe";
import { STORE_CURRENCY, demoProducts, fromStripe, invalidateCatalog, slugify, type Product } from "./catalog";

/**
 * Admin-side product management. Stripe is the single source of truth:
 * everything saved here is written to the Stripe product (name, description,
 * price, photos, metadata), and edits made in the Stripe dashboard flow back
 * through the webhook (or the 60s catalogue cache).
 */

export type AdminProduct = Product & { active: boolean; hasPrice: boolean; dashboardUrl: string };

/** Every metadata key the store reads (see catalog.ts). Empty strings remove the key in Stripe. */
export const MANAGED_KEYS = [
  "slug",
  "category",
  "collection",
  "sizes",
  "featured",
  "new",
  "sort",
  "group",
  "color",
  "color_hex",
  "compare_at",
  "release_at",
  "details",
  "colors",
  "variants",
] as const;
export type ManagedMetadata = Record<(typeof MANAGED_KEYS)[number], string>;

function toAdmin(p: Stripe.Product): AdminProduct {
  const mapped = fromStripe(p);
  const price = typeof p.default_price === "object" ? p.default_price : null;
  const base: Product =
    mapped ??
    // Product without an active default price: still show it so it can be fixed.
    ({
      ...fromStripe({ ...p, default_price: { id: "", active: true, unit_amount: 0, currency: STORE_CURRENCY } as Stripe.Price })!,
      priceId: "",
    } as Product);
  return { ...base, active: p.active, hasPrice: Boolean(price?.active && price.unit_amount != null), dashboardUrl: stripeDashboardUrl(`/products/${p.id}`) };
}

/** All shop products in Stripe, including archived ones (gift card products are skipped). */
export async function listAdminProducts(): Promise<AdminProduct[]> {
  const stripe = getStripe();
  const out: AdminProduct[] = [];
  for (const active of [true, false]) {
    for await (const p of stripe.products.list({ active, limit: 100, expand: ["data.default_price"] })) {
      if (p.metadata?.kind === "giftcard") continue;
      out.push(toAdmin(p));
    }
  }
  return out.sort((a, b) => Number(b.active) - Number(a.active) || a.sort - b.sort || b.createdAt - a.createdAt);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  try {
    const p = await getStripe().products.retrieve(id, { expand: ["default_price"] });
    return p.deleted ? null : toAdmin(p);
  } catch {
    return null;
  }
}

export type ProductInput = {
  name: string;
  description: string;
  unitAmount: number; // cents
  images: string[];
  active: boolean;
  metadata: ManagedMetadata;
};

/** Create a product with its price in one call. */
export async function createStripeProduct(input: ProductInput) {
  const stripe = getStripe();
  const product = await stripe.products.create({
    name: input.name,
    description: input.description || undefined,
    images: input.images,
    active: input.active,
    metadata: stripEmpty(input.metadata),
    default_price_data: { currency: STORE_CURRENCY, unit_amount: input.unitAmount },
  });
  invalidateCatalog();
  return product;
}

/**
 * Update a product. Stripe prices can't be edited, so a new price replaces the
 * old one (which is archived) when the amount changes.
 */
export async function updateStripeProduct(id: string, input: ProductInput) {
  const stripe = getStripe();
  const current = await stripe.products.retrieve(id, { expand: ["default_price"] });
  const oldPrice = typeof current.default_price === "object" ? current.default_price : null;

  let defaultPrice: string | undefined;
  if (!oldPrice || oldPrice.unit_amount !== input.unitAmount || !oldPrice.active || oldPrice.currency !== STORE_CURRENCY) {
    const price = await stripe.prices.create({ product: id, currency: STORE_CURRENCY, unit_amount: input.unitAmount });
    defaultPrice = price.id;
  }

  const product = await stripe.products.update(id, {
    name: input.name,
    description: input.description, // "" clears it
    images: input.images,
    active: input.active,
    metadata: input.metadata, // empty values remove the key
    ...(defaultPrice ? { default_price: defaultPrice } : {}),
  });
  if (defaultPrice && oldPrice?.active) await stripe.prices.update(oldPrice.id, { active: false });
  invalidateCatalog();
  return product;
}

export async function setStripeProductActive(id: string, active: boolean) {
  await getStripe().products.update(id, { active });
  invalidateCatalog();
}

/**
 * Delete for good. Stripe only allows this for products that were never sold
 * (no prices with payments), so anything else is archived instead.
 */
export async function deleteStripeProduct(id: string): Promise<"deleted" | "archived"> {
  const stripe = getStripe();
  try {
    // A product with prices can't be deleted; prices themselves can't be deleted either.
    await stripe.products.update(id, { default_price: "" });
    await stripe.products.del(id);
    invalidateCatalog();
    return "deleted";
  } catch {
    await setStripeProductActive(id, false);
    return "archived";
  }
}

/**
 * Upload a photo to Stripe and return a public link to it, so product photos
 * live in Stripe like ones added in the dashboard. Images are resized to keep
 * them fast (and inside Stripe's upload limits).
 */
export async function uploadProductImage(data: Buffer, name: string) {
  let out = await sharp(data).rotate().resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  for (const q of [76, 68, 60]) {
    if (out.length <= 480_000) break;
    out = await sharp(data).rotate().resize({ width: 1400, height: 1750, fit: "inside", withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }
  const file = await getStripe().files.create({
    purpose: "business_logo",
    file: { data: out, name: `${slugify(name.replace(/\.[a-z0-9]+$/i, "")) || "photo"}.jpg`, type: "image/jpeg" },
    file_link_data: { create: true },
  });
  const url = file.links?.data[0]?.url;
  if (!url) throw new Error("Stripe didn't return a link for the uploaded photo.");
  return url;
}

const isStripeHosted = (url: string) => /^https:\/\/([a-z0-9-]+\.)*stripe\.(com|me)\//i.test(url);

/** Copy any photo that isn't hosted by Stripe into Stripe (keeps order). */
export async function ensureStripeImages(urls: string[]) {
  return Promise.all(
    urls.map(async (url) => {
      if (isStripeHosted(url)) return url;
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) throw new Error(`Couldn't download the photo at ${url}`);
      return uploadProductImage(Buffer.from(await res.arrayBuffer()), new URL(url).pathname.split("/").pop() || "photo");
    }),
  );
}

/**
 * One-click move: copy the built-in catalogue (photos, prices, sizes, colours,
 * details) into Stripe. Products whose slug already exists in Stripe are skipped.
 */
export async function importDemoCatalogue(): Promise<{ created: number; skipped: number }> {
  const existing = new Set((await listAdminProducts()).map((p) => p.slug));
  let created = 0;
  let skipped = 0;
  for (const d of demoProducts()) {
    if (existing.has(d.slug)) {
      skipped++;
      continue;
    }
    const images: string[] = [];
    for (const src of d.images.slice(0, 8)) {
      if (/^https?:\/\//.test(src)) {
        images.push(src);
        continue;
      }
      const buf = await readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
      images.push(await uploadProductImage(buf, path.basename(src)));
    }
    await createStripeProduct({
      name: d.name,
      description: d.description,
      unitAmount: d.unitAmount,
      images,
      active: true,
      metadata: productMetadata(d),
    });
    created++;
  }
  invalidateCatalog();
  return { created, skipped };
}

/** Product → the metadata the store reads back. */
export function productMetadata(p: Product): ManagedMetadata {
  return {
    slug: p.slug,
    category: p.category,
    collection: p.collection,
    sizes: p.sizes.filter((s) => s !== "One Size").join(","),
    featured: p.featured ? "true" : "",
    new: p.isNew ? "true" : "",
    sort: p.sort && p.sort !== 999 ? String(p.sort) : "",
    group: p.group ?? "",
    color: p.color ?? "",
    color_hex: p.colorHex ?? "",
    compare_at: p.compareAtAmount ? (p.compareAtAmount / 100).toFixed(2) : "",
    release_at: p.releaseAt ? new Date(p.releaseAt).toISOString() : "",
    details: p.details.join("|"),
    colors: p.colors.map((c) => `${c.name}:${c.hex}`).join("|"),
    variants: p.variants?.join("|") ?? "",
  };
}

function stripEmpty(m: Record<string, string>) {
  return Object.fromEntries(Object.entries(m).filter(([, v]) => v !== ""));
}
