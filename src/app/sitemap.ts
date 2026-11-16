import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { JOURNAL } from "@/content/journal";
import { CATEGORIES } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const xmlSafe = (u: string) => u.replace(/&/g, "&amp;");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const abs = (u: string) => xmlSafe(u.startsWith("http") ? u : `${base}${u}`);
  const products = await getProducts();
  const newest = products.reduce((m, p) => Math.max(m, p.createdAt || 0), 0);
  const catalogUpdated = newest ? new Date(newest) : undefined;
  const latestPost = JOURNAL.reduce((m, p) => (p.date > m ? p.date : m), "");

  const pages: [path: string, priority: number, freq: "daily" | "weekly" | "monthly"][] = [
    ["", 1, "daily"],
    ["/shop", 0.9, "daily"],
    ["/drops", 0.7, "daily"],
    ["/collections", 0.7, "weekly"],
    ["/gift-cards", 0.6, "monthly"],
    ["/journal", 0.6, "weekly"],
    ["/about", 0.6, "monthly"],
    ["/help", 0.5, "monthly"],
    ["/help/contact", 0.4, "monthly"],
    ["/track", 0.3, "monthly"],
  ];
  const categories = CATEGORIES.filter((c) => products.some((p) => p.category === c.slug));
  const legal = ["privacy", "terms", "cookies", "returns", "imprint"];

  return [
    ...pages.map(([p, priority, changeFrequency]) => ({
      url: `${base}${p}`,
      changeFrequency,
      priority,
      ...(p === "" || p === "/shop" ? { lastModified: catalogUpdated } : p === "/journal" && latestPost ? { lastModified: new Date(latestPost) } : {}),
    })),
    // Category pages: each is its own landing page ("oolu t-shirts", "oolu tracksuits").
    ...categories.map((c) => ({ url: xmlSafe(`${base}/shop?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(p.createdAt ? { lastModified: new Date(p.createdAt) } : {}),
      images: p.images.slice(0, 10).map(abs),
    })),
    ...JOURNAL.map((post) => ({ url: `${base}/journal/${post.slug}`, lastModified: new Date(post.date), changeFrequency: "monthly" as const, priority: 0.5, images: [abs(post.cover)] })),
    ...legal.map((p) => ({ url: `${base}/legal/${p}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
