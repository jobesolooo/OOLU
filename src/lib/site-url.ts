/**
 * The site's public address, used for email links, OAuth callbacks, Stripe redirects and SEO.
 * NEXT_PUBLIC_SITE_URL wins, except when a deployed site still has the local value
 * (e.g. copied from .env.local): then Vercel's production address is used instead.
 */
export function siteUrl() {
  const set = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  const local = !set || /\/\/(localhost|127\.0\.0\.1)(:|$)/.test(set);
  if (!local) return set;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (process.env.VERCEL && vercel) return `https://${vercel}`;
  return set || "http://localhost:3000";
}

/** True when NEXT_PUBLIC_SITE_URL is missing or points at this computer while deployed. */
export const siteUrlNeedsFixing = () =>
  Boolean(process.env.VERCEL) && !/^https:\/\//.test((process.env.NEXT_PUBLIC_SITE_URL ?? "").trim());
