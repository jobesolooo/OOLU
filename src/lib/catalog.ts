import "server-only";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./stripe";
import { DEMO_PRODUCTS } from "./demo-catalog";

export type Product = {
  id: string; // Stripe product id (or demo_<slug>)
  slug: string;
  name: string;
  description: string;
  priceId: string; // Stripe price id (or demo_price_<slug>)
  unitAmount: number; // cents
  currency: string;
  images: string[];
  category: string;
  collection: string;
  sizes: string[];
  featured: boolean;
  isNew: boolean;
  sort: number;
  createdAt: number;
  isDemo: boolean;
};

/**
 * Stripe product metadata the store understands (set these in the Stripe dashboard):
 *   slug        url slug, e.g. "brushstroke-tee-black" (defaults to the product name)
 *   category    "t-shirts" | "caps" | "hoodies" | anything you like
 *   collection  e.g. "brushstroke"
 *   sizes       comma-separated, e.g. "S,M,L,XL"  (omit for one-size items)
 *   featured    "true" to show in Featured Products on the homepage
 *   new         "true" to tag as a new arrival
 *   sort        number, lower shows first
 */
function fromStripe(p: Stripe.Product): Product | null {
  const price = p.default_price as Stripe.Price | null;
  if (!price || typeof price === "string" || price.unit_amount == null || !price.active) return null;
  const m = p.metadata ?? {};
  const sizes = (m.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    id: p.id,
    slug: m.slug?.trim() || slugify(p.name),
    name: p.name,
    description: p.description ?? "",
    priceId: price.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    images: p.images ?? [],
    category: m.category?.trim() || "t-shirts",
    collection: m.collection?.trim() || "",
    sizes: sizes.length ? sizes : ["One Size"],
    featured: m.featured === "true",
    isNew: m.new === "true",
    sort: Number(m.sort ?? 999) || 999,
    createdAt: p.created * 1000,
    isDemo: false,
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function demoProducts(): Product[] {
  const base = Date.UTC(2024, 0, 1);
  return DEMO_PRODUCTS.map((d, i) => ({
    id: `demo_${d.slug}`,
    slug: d.slug,
    name: d.name,
    description: d.description,
    priceId: `demo_price_${d.slug}`,
    unitAmount: d.unitAmount,
    currency: "usd",
    images: [`/images/products/${d.slug}.svg`],
    category: d.category,
    collection: d.collection,
    sizes: d.sizes,
    featured: Boolean(d.featured),
    isNew: Boolean(d.isNew),
    sort: d.sort,
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
    const mapped = fromStripe(p);
    if (mapped) products.push(mapped);
  }
  // Fall back to the demo catalog until the Stripe account has products.
  const result = products.length ? sortProducts(products) : demoProducts();
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

export async function getFeaturedProducts(limit = 5) {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export type ShopQuery = { category?: string; collection?: string; sort?: string; q?: string };

export async function queryProducts({ category, collection, sort, q }: ShopQuery) {
  let list = await getProducts();
  if (category) list = list.filter((p) => p.category === category);
  if (collection) list = list.filter((p) => p.collection === collection);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.description} ${p.category} ${p.collection}`.toLowerCase().includes(needle));
  }
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
