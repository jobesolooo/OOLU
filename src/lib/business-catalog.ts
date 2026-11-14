/**
 * Business details the staff edit in Admin → Settings → Business details.
 * Shared by the server (saving) and the settings screen (labels, help).
 * An empty field means "use the default" (shown as the placeholder).
 */
export type BizField = {
  name: BizKey;
  label: string;
  help?: string;
  kind?: "text" | "email" | "tel" | "url" | "money" | "number" | "textarea";
  /** Where on the site this shows, so staff know what they're changing. */
  shows: string;
  max?: number;
};

export type BizKey =
  | "name"
  | "tagline"
  | "description"
  | "legalName"
  | "address"
  | "kvk"
  | "vat"
  | "email"
  | "phone"
  | "city"
  | "hours"
  | "instagram"
  | "tiktok"
  | "freeShippingFrom"
  | "flatRate"
  | "countries"
  | "returnDays"
  | "returnAddress";

export type BizGroup = { id: string; title: string; blurb: string; fields: BizField[] };

export const BIZ_GROUPS: BizGroup[] = [
  {
    id: "brand",
    title: "Brand",
    blurb: "How the shop names and describes itself.",
    fields: [
      { name: "name", label: "Store name", shows: "Browser tabs, Google results, footer, every email", max: 40 },
      { name: "tagline", label: "Tagline", shows: "Footer and email footer (leave empty to keep the translated tagline)", max: 120 },
      { name: "description", label: "Short description", kind: "textarea", shows: "Google and link previews", max: 300 },
    ],
  },
  {
    id: "company",
    title: "Company & contact",
    blurb: "Required by Dutch law on the legal pages. Fill these in before taking real orders.",
    fields: [
      { name: "legalName", label: "Legal company name", shows: "Privacy policy, terms, imprint", max: 120 },
      { name: "address", label: "Business address", shows: "Legal pages", max: 200 },
      { name: "kvk", label: "KvK number", shows: "Legal pages", max: 20 },
      { name: "vat", label: "VAT (BTW) number", shows: "Legal pages", max: 30 },
      { name: "email", label: "Customer service email", kind: "email", shows: "Contact page, footer, legal pages", max: 120 },
      { name: "phone", label: "Phone number", kind: "tel", shows: "Contact page, legal pages", max: 40 },
      { name: "city", label: "Studio location", shows: "Contact page studio card (leave empty for the default)", max: 60 },
      { name: "hours", label: "Opening / reply hours", shows: "Contact page studio card (leave empty for the default)", max: 80 },
    ],
  },
  {
    id: "social",
    title: "Social media",
    blurb: "Paste the full profile link. Leave one empty to hide it.",
    fields: [
      { name: "instagram", label: "Instagram link", kind: "url", shows: "Footer, contact page, Google", max: 200 },
      { name: "tiktok", label: "TikTok link", kind: "url", shows: "Footer, contact page, Google", max: 200 },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & returns",
    blurb: "Used by checkout and quoted on the product, cart, help and about pages.",
    fields: [
      { name: "freeShippingFrom", label: "Free shipping from (€)", kind: "money", shows: "Checkout, cart progress bar, product pages", max: 10 },
      { name: "flatRate", label: "Shipping cost below that (€)", kind: "money", shows: "Checkout, help page", max: 10 },
      { name: "countries", label: "Ship to countries", help: "Two-letter codes, comma separated, e.g. NL, BE, DE", shows: "Checkout", max: 600 },
      { name: "returnDays", label: "Return window (days)", kind: "number", shows: "Product, help and about pages, return requests", max: 3 },
      { name: "returnAddress", label: "Return address", kind: "textarea", shows: "Email sent when a return is approved", max: 300 },
    ],
  },
];
