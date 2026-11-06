/**
 * Journal & lookbook posts. Placeholder stories written in the brand's voice —
 * replace the copy and images with the real campaigns.
 *
 * Block types: p (paragraph), h2 (heading), quote, image, products (shop-the-look, by product slug).
 */
export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "image"; src: string; alt: string; caption?: string; position?: string }
  | { type: "products"; title?: string; slugs: string[] };

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Lookbook" | "Story" | "Process";
  date: string; // ISO
  cover: string;
  coverPosition?: string;
  blocks: JournalBlock[];
};

export const JOURNAL: JournalPost[] = [
  {
    slug: "sunday-service-chapter-one",
    title: "Sunday Service — Chapter One",
    excerpt: "Concrete, palms and the piece that started it all. The first Wstablished lookbook, shot on the West Side.",
    category: "Lookbook",
    date: "2026-10-18",
    cover: "/images/hero-photo.jpg",
    coverPosition: "45% center",
    blocks: [
      { type: "p", text: "Sunday Service was never about church clothes. It's about the one day you get to slow down, show up as yourself and still look like you meant it." },
      { type: "image", src: "/images/hero-photo.jpg", alt: "Model in the brown Sunday Service tee and cap", caption: "Sunday Service tee in brown, WST cap.", position: "45% center" },
      { type: "p", text: "We shot Chapter One against raw concrete, the same walls we grew up leaning on. Heavyweight cotton, washed brown, the palm hit on the chest. Nothing extra." },
      { type: "products", title: "Shop the look", slugs: ["sunday-service-tee-brown", "wst-sunday-service-cap"] },
      { type: "image", src: "/images/drops-photo.jpg", alt: "Model sitting on concrete steps", caption: "Same mindset. Different energy.", position: "30% center" },
      { type: "quote", text: "Built for the real ones. That's the whole brief.", by: "Wstablished" },
    ],
  },
  {
    slug: "rooted-in-culture",
    title: "Rooted in culture, built for tomorrow",
    excerpt: "Why we started Wstablished, and what the W stands for when nobody's watching.",
    category: "Story",
    date: "2026-09-02",
    cover: "/images/tile-new.jpg",
    blocks: [
      { type: "p", text: "Wstablished started with a simple idea: clothes for people who are building something, even when it's not finished yet." },
      { type: "h2", text: "The dreamers, the doers" },
      { type: "p", text: "Every piece is designed in small runs. When a drop is gone, it's gone. That's not a marketing trick — it's how we keep quality high and waste low." },
      { type: "quote", text: "More than clothing — it's a mindset." },
      { type: "h2", text: "What's next" },
      { type: "p", text: "Essentials, more colourways, and a few collaborations we can't talk about yet. Join the list to hear first." },
      { type: "products", title: "The essentials", slugs: ["w-monogram-hoodie-black", "brushstroke-tee-black"] },
    ],
  },
  {
    slug: "making-the-brushstroke-tee",
    title: "Making the Brushstroke tee",
    excerpt: "From a hand-painted sketch to 240gsm cotton: how our signature graphic comes to life.",
    category: "Process",
    date: "2026-07-21",
    cover: "/images/tile-tshirts.jpg",
    blocks: [
      { type: "p", text: "The WST brushstroke began as a single hand-painted stroke on paper. We scanned it, kept every rough edge and printed it the way it was made: fast and honest." },
      { type: "image", src: "/images/tile-tshirts.jpg", alt: "Back of the black Brushstroke tee", caption: "Brushstroke tee, black." },
      { type: "h2", text: "Heavyweight, on purpose" },
      { type: "p", text: "240gsm cotton, boxy fit, dropped shoulders. It holds its shape and gets better with every wash." },
      { type: "products", title: "Shop the brushstroke", slugs: ["brushstroke-tee-black", "brushstroke-tee-red"] },
    ],
  },
];

export const getPost = (slug: string) => JOURNAL.find((p) => p.slug === slug) ?? null;
export const latestPosts = (n = 3) => [...JOURNAL].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
