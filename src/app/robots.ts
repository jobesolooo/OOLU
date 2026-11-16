import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private pages, and sorted copies of the shop (the unsorted page is the one to index).
        disallow: ["/admin", "/account", "/api", "/cart", "/checkout", "/wishlist", "/gift-cards/success", "/*?*sort="],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
