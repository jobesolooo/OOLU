import "server-only";
import { getSettings } from "./settings";
import { getBusiness } from "./business";

export type IgTile = { href: string; image: string; alt: string; ours: boolean };
export type TtTile = { href: string; image: string | null; caption: string; videoId: string | null; ours: boolean };

/** New shoot photos, used until real posts are added in Settings (they link to the profiles, not to made-up posts). */
const SHOOT = [
  "/images/brand/hero-roots-journey.jpg",
  "/images/brand/hoodie-set-glow.jpg",
  "/images/brand/story-crowd.jpg",
  "/images/brand/tracksuit-front-white.jpg",
  "/images/brand/drop-portrait.jpg",
  "/images/brand/move-streaks.jpg",
  "/images/brand/move-painted.jpg",
  "/images/brand/backs-roots-journey.jpg",
];

const TT_TTL = 6 * 3600_000;
const ttCache = new Map<string, { at: number; tile: TtTile }>();

const videoIdOf = (url: string) => url.match(/\/video\/(\d+)/)?.[1] ?? null;

/** TikTok's public oEmbed gives the thumbnail and caption for a video link (no account or key needed). */
async function tiktokTile(url: string): Promise<TtTile> {
  const hit = ttCache.get(url);
  if (hit && Date.now() - hit.at < TT_TTL) return hit.tile;
  const fallback: TtTile = { href: url, image: null, caption: "", videoId: videoIdOf(url), ours: true };
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    if (!res.ok) return fallback;
    const j = (await res.json()) as { thumbnail_url?: string; title?: string; embed_product_id?: string };
    const tile: TtTile = { href: url, image: j.thumbnail_url ?? null, caption: (j.title ?? "").slice(0, 140), videoId: j.embed_product_id ?? videoIdOf(url), ours: true };
    ttCache.set(url, { at: Date.now(), tile });
    return tile;
  } catch {
    return fallback;
  }
}

export async function getSocialFeed() {
  const [s, b] = await Promise.all([getSettings(), getBusiness()]);
  if (!s.social.enabled) return null;
  const igProfile = b.social.instagram ?? "https://www.instagram.com/";
  const ttProfile = b.social.tiktok ?? "https://www.tiktok.com/";
  const instagram: IgTile[] = s.social.instagram.length
    ? s.social.instagram.map((p) => ({ href: p.url || igProfile, image: p.image, alt: "OOLU on Instagram", ours: true }))
    : SHOOT.map((image) => ({ href: igProfile, image, alt: "OOLU Roots and Journey shoot", ours: false }));
  const tiktok: TtTile[] = s.social.tiktok.length
    ? await Promise.all(s.social.tiktok.map(tiktokTile))
    : [SHOOT[4], SHOOT[6], SHOOT[7], SHOOT[5], SHOOT[1]].map((image) => ({ href: ttProfile, image, caption: "", videoId: null, ours: false }));
  return { instagram, tiktok, igProfile, ttProfile, igHandle: b.handles.instagram, ttHandle: b.handles.tiktok };
}
