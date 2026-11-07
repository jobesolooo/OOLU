# Deploying OOLU to Vercel

The repo is ready for Vercel: every deploy creates/updates the database tables
(`vercel-build` runs `scripts/migrate.ts`, then `next build`), and `vercel.json`
schedules the daily drop-alert job.

## 1. Import the project (2 min)
1. Go to https://vercel.com/new and sign in with GitHub.
2. Import **jobesolooo/OOLU**. Framework: Next.js (auto-detected). Leave build settings as they are.
3. Don't deploy yet if it asks — add the database and settings first (or deploy, let it fail, and redeploy after step 3).

## 2. Add a database (1 min)
Project → **Storage** → **Create Database** → **Neon (Postgres)** → free plan → connect to the project.
This adds `DATABASE_URL` automatically. (Your local test data stays on your Mac.)

## 3. Environment variables
Project → **Settings → Environment Variables**. Required:

| Name | Value |
| --- | --- |
| `SESSION_SECRET` | 32+ random characters — run `openssl rand -base64 32` |
| `ADMIN_USERNAME` | `Janna` |
| `ADMIN_PASSCODE_HASH` | the `scrypt:…` line from your `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel address, e.g. `https://oolu.vercel.app` (later your own domain) |
| `CRON_SECRET` | another random string (`openssl rand -base64 24`) |

When you're ready to sell (store shows demo products until then):

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | from Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint `https://<your-site>/api/webhooks/stripe` (events listed in Admin → Settings) |
| `RESEND_API_KEY`, `EMAIL_FROM` | for order, reset and welcome emails |
| `GOOGLE_CLIENT_ID/SECRET`, `APPLE_*` | only if you use Google/Apple sign-in (add the Vercel URL as a redirect) |

Then **Deployments → ⋯ → Redeploy** so the new settings are used.

## 4. After the first deploy
- Open `/admin/login` and sign in as Janna.
- With Stripe connected: Admin → Products → **Copy catalogue to Stripe**.
- Custom domain: Project → Settings → Domains, then update `NEXT_PUBLIC_SITE_URL`.

Every `git push` to `main` deploys automatically after this.
