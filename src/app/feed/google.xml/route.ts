import { getProducts, isOnSale, isUpcoming } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { allVariantKeys } from "@/lib/variants";
import { getBusiness } from "@/lib/business";
import { CATEGORIES } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const tag = (name: string, value: string | number | null | undefined) => (value === null || value === undefined || value === "" ? "" : `<g:${name}>${esc(String(value))}</g:${name}>`);

/** Google's own category ids: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt */
const GOOGLE_CATEGORY: Record<string, number> = {
  "t-shirts": 212, // Apparel & Accessories > Clothing > Shirts & Tops
  "sleeveless-and-tanks": 212,
  tracksuits: 5322, // Apparel & Accessories > Clothing > Activewear
  hoodies: 5322,
};

/**
 * Product feed for Google Merchant Center (free listings in Shopping, Images and Search).
 * One item per size/colour so Google shows the right stock for each; items of one product share item_group_id.
 */
export async function GET() {
  const base = siteUrl();
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u}`);
  const [products, b] = await Promise.all([getProducts(), getBusiness()]);
  const stock = await getStockMap(products.map((p) => p.id));
  const label = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
  const shipping = (cents: number) =>
    b.countries
      .map((c) => `<g:shipping><g:country>${c}</g:country><g:price>${(cents >= b.freeShippingThreshold ? 0 : b.flatRate / 100).toFixed(2)} EUR</g:price></g:shipping>`)
      .join("");

  const items = products.flatMap((p) => {
    const keys = allVariantKeys(p);
    const upcoming = isUpcoming(p);
    const price = `${(p.unitAmount / 100).toFixed(2)} ${p.currency.toUpperCase()}`;
    const sale = isOnSale(p);
    const variants = keys.length ? keys : [""];
    return variants.map((key) => {
      const [color, size] = key.includes(" / ") ? key.split(" / ") : [p.color, key];
      const qty = stock.get(stockKey(p.id, key));
      const availability = upcoming ? "preorder" : qty === undefined || qty > 0 ? "in_stock" : "out_of_stock";
      const link = `${base}/products/${p.slug}`;
      return [
        "<item>",
        tag("id", key ? `${p.id}-${key.replace(/[^\w]+/g, "-")}`.slice(0, 50) : p.id),
        tag("item_group_id", p.group ?? p.id),
        tag("title", [p.name, color && !p.name.toLowerCase().includes(String(color).toLowerCase()) ? color : null, size ? `Size ${size}` : null].filter(Boolean).join(" – ").slice(0, 150)),
        tag("description", (p.description || `${p.name} by ${b.name}. ${p.details.join(". ")}`).slice(0, 5000)),
        tag("link", link),
        tag("image_link", p.images[0] ? abs(p.images[0]) : null),
        ...p.images.slice(1, 11).map((i) => tag("additional_image_link", abs(i))),
        tag("availability", availability),
        upcoming && p.releaseAt ? tag("availability_date", new Date(p.releaseAt).toISOString()) : "",
        tag("price", sale ? `${(p.compareAtAmount! / 100).toFixed(2)} ${p.currency.toUpperCase()}` : price),
        sale ? tag("sale_price", price) : "",
        tag("condition", "new"),
        tag("brand", b.name),
        tag("identifier_exists", "no"),
        tag("mpn", p.id),
        tag("google_product_category", GOOGLE_CATEGORY[p.category] ?? 1604),
        tag("product_type", `Clothing > ${label(p.category)}`),
        tag("color", color),
        tag("size", size),
        tag("age_group", "adult"),
        tag("gender", "unisex"),
        shipping(p.unitAmount),
        "</item>",
      ].join("");
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${esc(b.name)}</title><link>${base}</link><description>${esc(b.description ?? `${b.name} clothing`)}</description>
${items.join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
