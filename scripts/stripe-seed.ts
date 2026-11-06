/**
 * Creates the starter catalog in your Stripe account (use TEST mode keys).
 * Safe to run more than once: products are matched by their `slug` metadata.
 * Usage: npm run stripe:seed
 */
import Stripe from "stripe";
import { DEMO_PRODUCTS } from "../src/lib/demo-catalog";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Set STRIPE_SECRET_KEY in .env.local first.");
  if (key.startsWith("sk_live")) {
    console.warn("⚠  You're using a LIVE key. Products will be created in live mode.");
  }
  const stripe = new Stripe(key);

  for (const p of DEMO_PRODUCTS) {
    const existing = await stripe.products.search({ query: `metadata['slug']:'${p.slug}'` });
    if (existing.data.length) {
      console.log(`• ${p.name} already exists (${existing.data[0].id})`);
      continue;
    }
    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: {
        slug: p.slug,
        category: p.category,
        collection: p.collection,
        sizes: p.sizes.join(","),
        featured: String(Boolean(p.featured)),
        new: String(Boolean(p.isNew)),
        sort: String(p.sort),
      },
      default_price_data: { currency: "usd", unit_amount: p.unitAmount, tax_behavior: "exclusive" },
    });
    console.log(`✓ Created ${p.name} (${product.id})`);
  }
  console.log("\nDone. Upload product photos in the Stripe dashboard (Product catalog → product → Images).");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
