/**
 * Starter catalog. Used to render the store before Stripe is connected, and
 * by `npm run stripe:seed` to create these products in Stripe (test mode).
 * Once Stripe is connected, products come from the Stripe dashboard instead.
 */
export type DemoProduct = {
  slug: string;
  name: string;
  description: string;
  unitAmount: number; // cents
  category: "t-shirts" | "caps" | "hoodies";
  collection: string;
  sizes: string[];
  featured?: boolean;
  isNew?: boolean;
  sort: number;
};

const TEE_SIZES = ["S", "M", "L", "XL", "XXL"];

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: "brushstroke-tee-black",
    name: "Brushstroke Tee – Black",
    description:
      "Heavyweight cotton tee with the hand-painted WST brushstroke print. Boxy fit, dropped shoulders, ribbed collar.",
    unitAmount: 3000,
    category: "t-shirts",
    collection: "brushstroke",
    sizes: TEE_SIZES,
    featured: true,
    sort: 1,
  },
  {
    slug: "brushstroke-tee-red",
    name: "Brushstroke Tee – Red",
    description:
      "The brushstroke tee in a deep red. Heavyweight cotton, boxy fit, built to hold its shape wash after wash.",
    unitAmount: 3000,
    category: "t-shirts",
    collection: "brushstroke",
    sizes: TEE_SIZES,
    featured: true,
    sort: 2,
  },
  {
    slug: "paint-the-west",
    name: "Paint the West Collection",
    description:
      "Statement tee with the paint-splash W graphic on a natural cream body. Each print carries its own drips and texture.",
    unitAmount: 4500,
    category: "t-shirts",
    collection: "paint-the-west",
    sizes: TEE_SIZES,
    featured: true,
    sort: 3,
  },
  {
    slug: "west-side-testament-tee",
    name: "West Side Testament Tee",
    description:
      "Vintage-wash brown tee with the West Side Testament artwork across the chest. Relaxed fit, soft hand feel.",
    unitAmount: 2500,
    category: "t-shirts",
    collection: "west-side",
    sizes: TEE_SIZES,
    featured: true,
    sort: 4,
  },
  {
    slug: "wst-sunday-service-cap",
    name: "WST Sunday Service Cap",
    description:
      "Structured six-panel cap in brown with tonal WST Sunday Service embroidery and palm detail. Adjustable strap.",
    unitAmount: 2500,
    category: "caps",
    collection: "sunday-service",
    sizes: ["One Size"],
    featured: true,
    sort: 5,
  },
  {
    slug: "sunday-service-tee-brown",
    name: "Sunday Service Tee – Brown",
    description:
      "Oversized brown tee with the WST Sunday Service script and palm print. The piece that started it all.",
    unitAmount: 3500,
    category: "t-shirts",
    collection: "sunday-service",
    sizes: TEE_SIZES,
    isNew: true,
    sort: 6,
  },
  {
    slug: "west-side-tee-cream",
    name: "Wstablished West Side Tee – Cream",
    description: "Cream tee with the Wstablished West Side varsity print. Heavyweight cotton, relaxed fit.",
    unitAmount: 3500,
    category: "t-shirts",
    collection: "west-side",
    sizes: TEE_SIZES,
    isNew: true,
    sort: 7,
  },
  {
    slug: "w-monogram-hoodie-black",
    name: "W Monogram Hoodie – Black",
    description:
      "Brushed-back fleece hoodie with the serif W monogram on the chest. Double-lined hood, kangaroo pocket.",
    unitAmount: 6500,
    category: "hoodies",
    collection: "essentials",
    sizes: TEE_SIZES,
    isNew: true,
    sort: 8,
  },
];

export const COLLECTIONS: Record<string, { title: string; blurb: string }> = {
  brushstroke: { title: "Brushstroke", blurb: "Hand-painted energy on heavyweight cotton." },
  "paint-the-west": { title: "Paint the West", blurb: "Statement pieces with the paint-splash W." },
  "west-side": { title: "West Side", blurb: "Vintage washes and varsity type, straight from the coast." },
  "sunday-service": { title: "Sunday Service", blurb: "The palms, the script, the original." },
  essentials: { title: "Essentials", blurb: "Everyday staples with the W monogram." },
};
