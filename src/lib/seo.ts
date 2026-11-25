import "server-only";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import { getBusiness, type Business } from "./business";
import { siteUrl } from "./site-url";

/** Absolute URL for a path or an already-absolute link (Stripe images etc.). */
export const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${siteUrl()}${u.startsWith("/") ? "" : "/"}${u}`);

/**
 * Metadata for one public page: its own canonical URL, description and share preview.
 * Next replaces (not merges) openGraph per page, so the site name and locale are repeated here.
 */
export async function pageMeta({
  path,
  title,
  description,
  image,
  type = "website",
  absoluteTitle = false,
}: {
  path: string;
  title?: string;
  description?: string | null;
  image?: string | null;
  type?: "website" | "article";
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const [{ t, locale }, b] = await Promise.all([getT(), getBusiness()]);
  const desc = (description || b.description || t("brand.description")).replace(/\s+/g, " ").trim().slice(0, 300);
  const img = image || "/images/brand/hero-roots-journey.jpg";
  const shareTitle = title ? (absoluteTitle ? title : `${title} | ${b.name}`) : undefined;
  return {
    ...(title ? { title: absoluteTitle ? { absolute: title } : title } : {}),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      siteName: b.name,
      locale: intlLocale(locale).replace("-", "_"),
      type,
      url: path,
      ...(shareTitle ? { title: shareTitle } : {}),
      description: desc,
      images: [img],
    },
    twitter: { card: "summary_large_image", ...(shareTitle ? { title: shareTitle } : {}), description: desc, images: [img] },
  };
}

/** Breadcrumb trail for Google results ("ooluclothing.com › Shop › T-Shirts"). */
export function breadcrumbs(items: [name: string, path: string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
  };
}

export const ORG_ID = () => `${siteUrl()}/#organization`;
export const WEBSITE_ID = () => `${siteUrl()}/#website`;

/** Return policy in Google's format (used on the organisation and every product offer). */
export function returnPolicy(b: Business) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: b.countries.slice(0, 50),
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: b.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: abs("/legal/returns"),
  };
}

/** Shipping cost + delivery time for one product price (free above the threshold). */
export function shippingDetails(b: Business, priceCents: number, currency: string) {
  const free = priceCents >= b.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: free ? "0.00" : (b.flatRate / 100).toFixed(2), currency },
    shippingDestination: b.countries.slice(0, 50).map((c) => ({ "@type": "DefinedRegion", addressCountry: c })),
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
    },
  };
}

/** Safe JSON for a <script type="application/ld+json"> tag. */
export const ldJson = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
