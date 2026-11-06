/**
 * Everything brand-related lives here so the copy and imagery can be swapped
 * without touching components. Replace the placeholder images in
 * /public/images with real photography and update the paths below.
 */
export const site = {
  name: "Wstablished",
  wordmark: "WSTABLISHED",
  shortMark: "WST",
  tagline: "Rooted in culture. Built for tomorrow.",
  description:
    "More than clothing — it's a mindset. Wstablished is for the dreamers, the doers, and the ones who stay solid.",
  established: "EST. 2024",
  coordinates: ["34.0522° N", "118.2437° W"],
  announcement: "Free shipping on orders over $100",
  region: "Worldwide",
  currency: "USD",

  hero: {
    eyebrow: "Streetwear / Culture / You",
    title: ["Built for", "the real", "ones."],
    body: ["More than clothing —", "it's a mindset. Wstablished", "is for the dreamers, the doers,", "and the ones who stay solid."],
    cta: { label: "Shop now", href: "/shop" },
    image: "/images/hero.svg",
    // Optional transparent cut-out of the model, layered in front of the big
    // wordmark (like the mockup). Set to null if the hero photo already includes the model.
    foreground: "/images/hero-figure.svg" as string | null,
  },

  categories: [
    { label: "T-Shirts", href: "/shop?category=t-shirts", image: "/images/tile-tshirts.svg" },
    { label: "Collections", href: "/collections", image: "/images/tile-collections.svg" },
    { label: "Caps", href: "/shop?category=caps", image: "/images/tile-caps.svg" },
    { label: "New Arrivals", href: "/shop?sort=new", image: "/images/tile-new.svg" },
  ],

  drops: {
    eyebrow: "New arrivals",
    title: ["Fresh", "drops"],
    body: ["The latest pieces from", "Wstablished. Limited stock.", "Don't miss out."],
    cta: { label: "View all", href: "/shop?sort=new" },
    aside: ["Same mindset.", "Different", "energy."],
    image: "/images/drops.svg",
  },

  perks: [
    { icon: "truck", title: "Fast shipping", body: "Worldwide Delivery" },
    { icon: "shield", title: "Secure payments", body: "Shop with Confidence" },
    { icon: "returns", title: "Easy returns", body: "Hassle-Free Returns" },
    { icon: "leaf", title: "Premium quality", body: "Built to Last" },
  ],

  nav: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "About", href: "/about" },
  ],

  social: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    youtube: "https://youtube.com/",
    x: "https://x.com/",
  },

  footerImage: "/images/footer-skyline.svg",
} as const;

export const CATEGORIES = [
  { slug: "t-shirts", label: "T-Shirts" },
  { slug: "caps", label: "Caps" },
  { slug: "hoodies", label: "Hoodies" },
] as const;
