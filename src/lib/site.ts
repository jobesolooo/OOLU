/**
 * Everything brand-related lives here so copy and imagery can be swapped
 * without touching components. Taken from ooluclothing.shop.
 */
export const site = {
  name: "OOLU",
  wordmark: "OOLU",
  shortMark: "OOLU",
  tagline: "Rooted in Africa. Created in Amsterdam. Made for the world.",
  motto: "Live in the present",
  description:
    "OOLU means trust. Clothing born from West African roots and built with a global vision — rooted in Africa, created in Amsterdam, made for the world.",
  established: "Built on trust",
  // Shown in the black promo strip under the hero (editable in Admin → Settings).
  announcement: "25% off OOLU tracksuit set, jacket & pants. Discount applied automatically at checkout.",
  announcementHref: "/products/oolu-tracksuit",
  region: "Worldwide",
  currency: "EUR",

  // Copy for these sections lives in the translation files (src/i18n): hero.*, marquee.*, story.*, feature.*
  hero: { image: "/images/brand/hero.jpg", ctaHref: "/products/oolu-tracksuit" },

  categories: [
    { slug: "t-shirts", image: "/images/brand/tile-t-shirts.jpg" },
    { slug: "sleeveless-and-tanks", image: "/images/brand/tile-tanks.jpg" },
    { slug: "tracksuits", image: "/images/brand/tile-tracksuits.jpg" },
  ],

  story: { image: "/images/brand/story-roots.jpg", ctaHref: "/shop" },

  features: [
    { key: "comfort", href: "/shop?category=t-shirts", image: "/images/brand/look-friends.jpg", tone: "#dcdcda" },
    { key: "move", href: "/shop?category=tracksuits", image: "/images/brand/made-to-move.jpg", tone: "#eeedeb" },
  ],

  // Labels are translation keys (src/i18n).
  nav: [
    { key: "nav.home", href: "/" },
    { key: "nav.catalog", href: "/shop" },
    { key: "nav.journal", href: "/journal" },
    { key: "nav.contact", href: "/help/contact" },
  ],

  social: {
    instagram: "https://www.instagram.com/oolu___oolu/",
    tiktok: "https://www.tiktok.com/@oolu263",
  },
  socialHandles: { instagram: "@oolu___oolu", tiktok: "@oolu263" },
} as const;

export const CATEGORIES = [
  { slug: "t-shirts", label: "T-Shirts" },
  { slug: "sleeveless-and-tanks", label: "Sleeveless & Tanks" },
  { slug: "tracksuits", label: "Tracksuits" },
  { slug: "hoodies", label: "Hoodies" },
] as const;
