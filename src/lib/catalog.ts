import "server-only";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./stripe";
import { DEMO_PRODUCTS } from "./demo-catalog";
import type { ColorOption } from "./variants";

export const STORE_CURRENCY = (process.env.STORE_CURRENCY ?? "eur").toLowerCase();

export type Product = {
  id: string; // Stripe product id (or demo_<slug>)
  slug: string;
  name: string;
  description: string;
  priceId: string; // Stripe price id (or demo_price_<slug>)
  unitAmount: number; // cents
  compareAtAmount: number | null; // cents; > unitAmount means "on sale"
  currency: string;
  images: string[];
  category: string;
  collection: string;
  sizes: string[];
  featured: boolean;
  isNew: boolean;
  sort: number;
  group: string | null;
  color: string | null;
  colorHex: string | null;
  releaseAt: number | null; // ms timestamp; in the future = upcoming drop
  details: string[];
  /** Colour options picked on the product page (empty = sizes only) */
  colors: ColorOption[];
  /** Existing "Colour / Size" combinations; null = every combination exists */
  variants: string[] | null;
  /** Demo catalogue only: combinations that start sold out */
  soldOut: string[];
  createdAt: number;
  isDemo: boolean;
};

export const isOnSale = (p: Pick<Product, "compareAtAmount" | "unitAmount">) =>
  p.compareAtAmount != null && p.compareAtAmount > p.unitAmount;
export const isUpcoming = (p: Pick<Product, "releaseAt">, now = Date.now()) => p.releaseAt != null && p.releaseAt > now;

/** "40", "40.00" or "4000c" → cents */
function parseMoney(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.trim();
  if (/^\d+c$/i.test(s)) return Number(s.slice(0, -1));
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

/**
 * Stripe product metadata the store understands (set these in the Stripe dashboard):
 *   slug        url slug, e.g. "brushstroke-tee-black" (defaults to the product name)
 *   category    "t-shirts" | "sleeveless-and-tanks" | "tracksuits" | "hoodies" | anything you like
 *   collection  e.g. "brushstroke"
 *   sizes       comma-separated, e.g. "S,M,L,XL"  (omit for one-size items)
 *   featured    "true" to show in Featured Products on the homepage
 *   new         "true" to tag as a new arrival
 *   sort        number, lower shows first
 *   group       shared id for colourways of the same item, e.g. "brushstroke-tee"
 *   color       colour name shown on the swatch, e.g. "Black"
 *   color_hex   swatch colour, e.g. "#151515"
 *   compare_at  original price in dollars, e.g. "40" → shows as a sale
 *   release_at  ISO date/time, e.g. "2026-12-01T18:00:00+01:00" → drop countdown, can't buy until then
 *   details     bullet points separated by "|", e.g. "240gsm cotton|Boxy fit|Made in Portugal"
 *   colors      colour options on one product, e.g. "Black:#111111|White:#f4f4f2"
 *   variants    (optional) only these "Colour / Size" combinations exist, separated by "|"
 */
function fromStripe(p: Stripe.Product): Product | null {
  const price = p.default_price as Stripe.Price | null;
  if (!price || typeof price === "string" || price.unit_amount == null || !price.active) return null;
  const m = p.metadata ?? {};
  const sizes = (m.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const releaseAt = m.release_at ? Date.parse(m.release_at) : NaN;
  return {
    id: p.id,
    slug: m.slug?.trim() || slugify(p.name),
    name: p.name,
    description: p.description ?? "",
    priceId: price.id,
    unitAmount: price.unit_amount,
    compareAtAmount: parseMoney(m.compare_at),
    currency: price.currency,
    images: p.images ?? [],
    category: m.category?.trim() || "t-shirts",
    collection: m.collection?.trim() || "",
    sizes: sizes.length ? sizes : ["One Size"],
    featured: m.featured === "true",
    isNew: m.new === "true",
    sort: Number(m.sort ?? 999) || 999,
    group: m.group?.trim() || null,
    color: m.color?.trim() || null,
    colorHex: m.color_hex?.trim() || null,
    releaseAt: Number.isFinite(releaseAt) ? releaseAt : null,
    details: (m.details ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    colors: parseColors(m.colors),
    variants: m.variants ? m.variants.split("|").map((s) => s.trim()).filter(Boolean) : null,
    soldOut: [],
    createdAt: p.created * 1000,
    isDemo: false,
  };
}

function parseColors(v: string | undefined): ColorOption[] {
  return (v ?? "")
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [name, hex] = c.split(":").map((x) => x.trim());
      return { name, hex: hex || "#cccccc" };
    });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DEFAULT_DETAILS: Record<string, string[]> = {
  "t-shirts": ["Soft, breathable cotton", "Relaxed fit", "OOLU logo print", "Designed in Amsterdam"],
  "sleeveless-and-tanks": ["Soft cotton jersey", "Clean sleeveless cut", "OOLU logo print", "Designed in Amsterdam"],
  tracksuits: ["Lightweight shell or brushed fleece", "Elasticated cuffs, hem and waist", "OOLU logo with purple underline", "Designed in Amsterdam"],
  hoodies: ["Brushed-back fleece", "Full zip, kangaroo pocket", "OOLU logo", "Designed in Amsterdam"],
};

function demoProducts(): Product[] {
  const base = Date.UTC(2024, 0, 1);
  // Round to the hour so the countdown target is stable between requests.
  const hour = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  return DEMO_PRODUCTS.map((d, i) => ({
    id: `demo_${d.slug}`,
    slug: d.slug,
    name: d.name,
    description: d.description,
    priceId: `demo_price_${d.slug}`,
    unitAmount: d.unitAmount,
    compareAtAmount: d.compareAt ?? null,
    currency: STORE_CURRENCY,
    images: d.images,
    category: d.category,
    collection: d.collection,
    sizes: d.sizes,
    featured: Boolean(d.featured),
    isNew: Boolean(d.isNew),
    sort: d.sort,
    group: d.group ?? null,
    color: d.color ?? null,
    colorHex: d.colorHex ?? null,
    releaseAt: d.releaseInDays ? hour + d.releaseInDays * 86_400_000 : null,
    details: DEFAULT_DETAILS[d.category] ?? [],
    colors: d.colors,
    variants: d.variants ?? null,
    soldOut: d.soldOut,
    createdAt: base + i * 86_400_000,
    isDemo: true,
  }));
}

// Small in-memory cache so we don't hit Stripe on every request.
const TTL_MS = 60_000;
let cache: { at: number; products: Product[] } | null = null;

export function invalidateCatalog() {
  cache = null;
}

export async function getProducts(): Promise<Product[]> {
  if (!isStripeConfigured()) return demoProducts();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.products;

  const stripe = getStripe();
  const products: Product[] = [];
  for await (const p of stripe.products.list({ active: true, limit: 100, expand: ["data.default_price"] })) {
    if (p.metadata?.kind === "giftcard") continue;
    const mapped = fromStripe(p);
    if (mapped) products.push(mapped);
  }
  // Fall back to the demo catalog until the Stripe account has products.
  const result = sortProducts(products.length ? products : demoProducts());
  cache = { at: Date.now(), products: result };
  return result;
}

export function sortProducts(list: Product[]) {
  return [...list].sort((a, b) => a.sort - b.sort || b.createdAt - a.createdAt);
}

export async function getProductBySlug(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  return (await getProducts()).find((p) => p.id === id) ?? null;
}

export async function getProductsByIds(ids: string[]) {
  const map = new Map((await getProducts()).map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
}

/** Other colourways of the same item (including itself), for swatches. */
export async function getVariants(product: Product) {
  if (!product.group) return [];
  return (await getProducts()).filter((p) => p.group === product.group);
}

export async function getFeaturedProducts(limit = 5) {
  const all = (await getProducts()).filter((p) => !isUpcoming(p));
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getUpcomingDrops() {
  return (await getProducts()).filter((p) => isUpcoming(p)).sort((a, b) => a.releaseAt! - b.releaseAt!);
}

export type ShopQuery = { category?: string; collection?: string; sort?: string; q?: string; sale?: boolean };

export async function queryProducts({ category, collection, sort, q, sale }: ShopQuery) {
  let list = await getProducts();
  if (category) list = list.filter((p) => p.category === category);
  if (collection) list = list.filter((p) => p.collection === collection);
  if (sale) list = list.filter(isOnSale);
  if (q) list = list.filter(searchMatcher(q));
  switch (sort) {
    case "new":
      list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt - a.createdAt);
      break;
    case "price-asc":
      list = [...list].sort((a, b) => a.unitAmount - b.unitAmount);
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.unitAmount - a.unitAmount);
      break;
  }
  return list;
}

/**
 * Search: every word must match somewhere (name, description, colours, category).
 * Category names in any of the shop's languages count too, so "trainingspak" or "chándal" finds tracksuits.
 */
export function searchMatcher(q: string, categoryAliases: Record<string, string[]> = CATEGORY_ALIASES) {
  const tokens = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  return (p: Product) => {
    const aliases = (categoryAliases[p.category] ?? []).join(" ");
    const hay = `${p.name} ${p.description} ${p.category.replace(/-/g, " ")} ${p.collection} ${p.color ?? ""} ${p.colors.map((c) => c.name).join(" ")} ${aliases}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return tokens.every((t) => hay.includes(t) || (t.endsWith("s") && hay.includes(t.slice(0, -1))));
  };
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  "t-shirts": ["tee", "tees", "shirt", "shirts", "t-shirt", "camiseta", "camisetas", "maglietta", "magliette"],
  "sleeveless-and-tanks": ["tank", "tanks", "tanktop", "singlet", "mouwloos", "debardeur", "debardeurs", "sans manches", "tirantes", "canotta", "canotte", "smanicato", "caveada", "caveadas", "sem mangas"],
  tracksuits: ["tracksuit", "trainingspak", "trainingspakken", "survetement", "survetements", "chandal", "chandales", "tuta", "tute", "fato de treino", "jacket", "pants", "jas", "broek"],
  hoodies: ["hoodie", "hoody", "sweater", "trui", "sweat", "sudadera", "felpa"],
};
