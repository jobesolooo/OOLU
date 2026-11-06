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

  hero: {
    eyebrow: "OOLU · Rooted in Africa. Created in Amsterdam.",
    title: "Live in the present.",
    cta: { label: "Shop the tracksuit", href: "/products/oolu-tracksuit" },
    image: "/images/brand/hero.jpg",
  },

  marquee: [
    "Rooted in Africa. Created in Amsterdam. Made for the world.",
    "Wear your roots. Tell your story.",
    "OOLU — Built on trust.",
  ],

  categories: [
    { slug: "t-shirts", label: "T-Shirts", image: "/images/brand/tile-t-shirts.jpg" },
    { slug: "sleeveless-and-tanks", label: "Sleeveless & Tanks", image: "/images/brand/tile-tanks.jpg" },
    { slug: "tracksuits", label: "Tracksuits", image: "/images/brand/tile-tracksuits.jpg" },
  ],

  story: {
    eyebrow: "Our story",
    title: "OOLU means trust.",
    body: [
      "Born from West African roots and built with a global vision, OOLU represents trust in yourself, trust in your journey and trust in where you come from.",
      "We create clothing for people who move with confidence, stay true to themselves and carry their identity with pride. Every OOLU piece is more than something you wear. It represents loyalty, connection, ambition and the courage to believe in your own path.",
      "Rooted in Africa. Created in Amsterdam. Made for the world.",
    ],
    signoff: "OOLU — Built on trust.",
    cta: { label: "Shop the collection", href: "/shop" },
    image: "/images/brand/story-roots.jpg",
  },

  features: [
    {
      title: "Easy comfort always",
      body: "Soft fabrics and relaxed fits keep you moving naturally from morning commute to late-night hangout",
      cta: { label: "Shop now", href: "/shop?category=t-shirts" },
      image: "/images/brand/look-friends.jpg",
      tone: "#dcdcda",
    },
    {
      title: "Made to move",
      body: "Each piece is crafted for long-lasting comfort, pared-back style, and quiet confidence on the go",
      cta: { label: "Shop now", href: "/shop?category=tracksuits" },
      image: "/images/brand/made-to-move.jpg",
      tone: "#eeedeb",
    },
  ],

  nav: [
    { label: "Home", href: "/" },
    { label: "Catalog", href: "/shop" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/help/contact" },
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
