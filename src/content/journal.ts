/**
 * Journal & lookbook posts, written in OOLU's voice from the brand copy on ooluclothing.shop.
 * Swap in real campaign stories and photography as they come.
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
    slug: "oolu-means-trust",
    title: "OOLU means trust",
    excerpt: "Born from West African roots and built with a global vision. What the name stands for, and why we wear it.",
    category: "Story",
    date: "2026-10-18",
    cover: "/images/brand/story-roots.jpg",
    blocks: [
      { type: "p", text: "OOLU represents trust in yourself, trust in your journey and trust in where you come from. It started as a word and became a way of carrying ourselves." },
      { type: "image", src: "/images/brand/story-roots.jpg", alt: "Three friends in OOLU “Your Roots.” t-shirts walking down a street", caption: "Wear your roots. Tell your story." },
      { type: "h2", text: "Rooted in Africa. Created in Amsterdam." },
      { type: "p", text: "We create clothing for people who move with confidence, stay true to themselves and carry their identity with pride. Every OOLU piece is more than something you wear." },
      { type: "quote", text: "It represents loyalty, connection, ambition and the courage to believe in your own path.", by: "OOLU" },
      { type: "products", title: "Start with the essentials", slugs: ["oolu-t-shirt", "oolu-everyday-t-shirt", "oolu-washed-t-shirt-purple-green-gray"] },
    ],
  },
  {
    slug: "the-tracksuit-lookbook",
    title: "The tracksuit — a lookbook",
    excerpt: "Tunnels, parks and late nights in the city: the OOLU tracksuit set, shot around Amsterdam.",
    category: "Lookbook",
    date: "2026-09-12",
    cover: "/images/brand/hero.jpg",
    coverPosition: "center 30%",
    blocks: [
      { type: "p", text: "The tracksuit is where OOLU feels most like itself: easy to throw on, sharp enough to be seen in. Jacket and pants, made to be worn together or apart." },
      { type: "image", src: "/images/brand/hero.jpg", alt: "Model in the black OOLU tracksuit walking through a tunnel", caption: "OOLU tracksuit set, black.", position: "center 30%" },
      { type: "image", src: "/images/brand/tracksuit-duo.jpg", alt: "Two models in matching OOLU tracksuits", caption: "Live in the present." },
      { type: "products", title: "Shop the look", slugs: ["oolu-tracksuit", "oolu-tracksuit-jacket", "oolu-tracksuit-pants"] },
      { type: "image", src: "/images/brand/made-to-move.jpg", alt: "Couple in OOLU tracksuits in a sunlit park", caption: "Made to move." },
    ],
  },
  {
    slug: "easy-comfort-always",
    title: "Easy comfort, always",
    excerpt: "Soft fabrics and relaxed fits, from morning commute to late-night hangout. A closer look at the OOLU tee.",
    category: "Process",
    date: "2026-07-21",
    cover: "/images/brand/look-friends.jpg",
    blocks: [
      { type: "p", text: "Every OOLU t-shirt starts with the same brief: it has to feel good on day one and better on day one hundred. Relaxed through the body, clean at the neck, logo kept small." },
      { type: "image", src: "/images/brand/look-friends.jpg", alt: "Three friends laughing on concrete steps in OOLU t-shirts", caption: "Washed and everyday tees." },
      { type: "h2", text: "Pared-back, on purpose" },
      { type: "p", text: "Long-lasting comfort, pared-back style and quiet confidence on the go. No noise — just pieces you reach for again and again." },
      { type: "products", title: "Shop the tees", slugs: ["oolu-t-shirt-coral-red", "oolu-t-shirt-hot-pink", "oolu-version-2-t-shirt"] },
    ],
  },
];

export const getPost = (slug: string) => JOURNAL.find((p) => p.slug === slug) ?? null;
export const latestPosts = (n = 3) => [...JOURNAL].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
