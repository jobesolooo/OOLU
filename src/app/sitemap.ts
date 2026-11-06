import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { JOURNAL } from "@/content/journal";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const products = await getProducts();
  const staticPages = ["", "/shop", "/collections", "/journal", "/drops", "/gift-cards", "/about", "/help", "/help/contact", "/track"];
  const legal = ["privacy", "terms", "cookies", "returns", "imprint"].map((p) => `/legal/${p}`);
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.slice(0, 1).map((i) => (i.startsWith("http") ? i : `${base}${i}`)),
    })),
    ...JOURNAL.map((post) => ({ url: `${base}/journal/${post.slug}`, lastModified: new Date(post.date), priority: 0.5 })),
    ...legal.map((p) => ({ url: `${base}${p}`, priority: 0.2 })),
  ];
}
