# Wstablished storefront (OOLU)

Next.js 16 + TypeScript e-commerce site for **Wstablished**, built from the homepage mockup, with Stripe payments, customer accounts and an admin dashboard.

## What's included

**Storefront**
- Homepage built from the mockup (hero, category tiles and "Fresh drops" use photos from the mockup), plus a drop countdown, New in, On sale, journal teaser, recently viewed and a newsletter band
- Shop with category / sale filters and sorting, collections, search
- Product pages: gallery with zoom, colour swatches, sale prices, size guide, details/shipping/returns/care, reviews with fit summary, "you may also like", recently viewed, Google product schema
- Wishlist (heart on every product, `/wishlist`), slide-out bag with free-shipping meter and gift card input

**Selling**
- Stripe Checkout: shipping, promo codes, optional Stripe Tax, gift cards
- Drops: products with a `release_at` date show a countdown and "notify me", can't be bought early, and waiting customers are emailed at launch (hourly cron)
- Back-in-stock alerts: sold-out sizes become "notify me"; raising stock in admin emails everyone waiting
- Newsletter with popup + footer signup; each new subscriber gets a unique single-use first-order code (Stripe promotion code)
- Digital gift cards (`/gift-cards`): bought via Stripe, emailed with a message, partial balances carry over
- Emails: order confirmation, owner alert, shipped, refund, return updates, welcome code, gift card, restock/drop, contact

**Customer service**
- Order tracking for guests (`/track`, order number + email) with a status timeline and carrier links
- Returns portal: customers pick items + reason from their account or the tracking page; admin approves → refunds via Stripe
- Help centre with FAQs and size charts, contact form → admin inbox
- Legal templates: privacy, terms, cookies, returns policy, imprint (EU/NL — fill in the [brackets] and have them checked)
- Journal / lookbook with "shop the look" (content in `src/content/journal.ts`)

**Admin (`/admin`)**
Orders & fulfilment, analytics (revenue chart, AOV, conversion, top products), products & stock, returns, review moderation, inbox, discount codes, gift cards, subscribers (+ CSV export), store settings (announcement bar, drop countdown, popup %).

**Products live in Stripe.** Add or edit them in the Stripe dashboard; the site reads them automatically. Until Stripe has products, the site shows a built-in demo catalog.

## Quick start (local)

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3000
```

Local dev needs **no database setup**: with `DATABASE_URL` empty it uses an embedded Postgres in `./.data`.

Minimum `.env.local` for a working local checkout:

```
STRIPE_SECRET_KEY=sk_test_...          # Stripe dashboard → Developers → API keys (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...        # from `stripe listen` below
SESSION_SECRET=<32+ random chars>      # openssl rand -base64 32
ADMIN_EMAILS=owner@example.com         # register with this email to get /admin
```

### 1. Put the products in Stripe

```bash
npm run stripe:seed
```

Creates the 8 starter products (with sizes, collections, featured flags) in your Stripe test account. Then upload real photos per product in the Stripe dashboard (Product catalog → product → Images).

### 2. Forward webhooks while developing

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`. Pay with test card `4242 4242 4242 4242`, any future date, any CVC.

### 3. Become admin

Register at `/account/register` with an email listed in `ADMIN_EMAILS`, then open `/admin`.

## Managing products in Stripe

Each product needs a **default price**. The site also reads these optional **metadata** keys:

| Key | Example | Purpose |
| --- | --- | --- |
| `slug` | `brushstroke-tee-black` | URL (defaults to the name) |
| `category` | `t-shirts`, `caps`, `hoodies` | Shop filters / homepage tiles |
| `collection` | `brushstroke` | Collections page |
| `sizes` | `S,M,L,XL,XXL` | Size picker (omit for one-size items) |
| `featured` | `true` | Shows in "Featured products" on the homepage |
| `new` | `true` | "New" tag and New Arrivals |
| `sort` | `1` | Lower numbers show first |
| `group` | `brushstroke-tee` | Same value on each colourway → colour swatches |
| `color` / `color_hex` | `Black` / `#151515` | Swatch name and colour |
| `compare_at` | `40` | Original price in dollars → shows as a sale |
| `release_at` | `2026-12-01T18:00:00+01:00` | Drop time → countdown + notify me |
| `details` | `240gsm cotton\|Boxy fit` | Bullet points (separate with `\|`) |

Changes appear within a minute (or instantly with the webhook / "Refresh from Stripe" button in admin). Stock per size is set in **Admin → Products & stock**; an empty box means "not tracked".

## Swapping in real photography

All brand copy and image paths live in `src/lib/site.ts`. Replace the placeholder files in `public/images/` (or point the paths at new files):

| File | Where it shows |
| --- | --- |
| `hero.svg` | Hero background |
| `hero-figure.svg` | Model cut-out in front of the big WSTABLISHED wordmark (transparent PNG works best; set `hero.foreground` to `null` if the hero photo already includes the model) |
| `tile-*.jpg`, `drops-photo.jpg` | Category tiles and "Fresh drops" band (cut from the mockup) |
| `footer-skyline.svg` | Footer background |

Product photos come from Stripe, not from this folder.

## Deploying (Vercel recommended)

1. Create a Postgres database (Neon, Supabase or Vercel Postgres) and set `DATABASE_URL`.
2. Run migrations once: `DATABASE_URL=... npm run db:migrate`.
3. Import the repo in Vercel and add all variables from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the real domain).
4. In Stripe → Developers → Webhooks, add `https://<domain>/api/webhooks/stripe` with these events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`.
   Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Set `CRON_SECRET` (any long random string) so the hourly drop-launch emails run, and `RETURN_ADDRESS` for return instructions.
6. For emails, add a [Resend](https://resend.com) key and verify the sending domain used in `EMAIL_FROM`.
7. Switch to live Stripe keys when ready (and re-run `npm run stripe:seed` or create products in live mode).

## Editing content

| What | Where |
| --- | --- |
| Brand copy, nav, homepage text, images | `src/lib/site.ts` |
| Announcement bar, drop countdown, popup | Admin → Settings |
| Size charts, collection names | `src/lib/demo-catalog.ts` (`SIZE_GUIDES`, `COLLECTIONS`) |
| Journal / lookbook posts | `src/content/journal.ts` |
| Legal pages + company details | `src/content/legal.ts` |
| FAQs | `src/app/help/page.tsx` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | Checks |
| `npm run stripe:seed` | Create starter products in Stripe |
| `npm run db:generate` | New migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run images:placeholders` | Regenerate placeholder artwork |

## Project map

```
src/app/            pages + API routes (checkout, Stripe webhook), /account, /admin
src/components/     header, footer, cart drawer, product card, homepage sections
src/lib/            catalog (Stripe), orders, inventory, auth/session, email, db schema
src/store/cart.ts   client cart (zustand)
scripts/            stripe seed, migrations, placeholder generator
drizzle/            SQL migrations
```
