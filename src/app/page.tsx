import { getFeaturedProducts, getProducts, getUpcomingDrops, isOnSale } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { DEFAULT_SETTINGS, getSettings, holidayActive } from "@/lib/settings";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { getBusiness } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { latestPosts } from "@/content/journal";
import { nowMs } from "@/lib/time";
import { Hero } from "@/components/home/Hero";
import { CategoryTiles, DropBanner, Features, GiftBand, JournalTeaser, NewCollection, SocialFeed, NewsletterBand, ProductRow, Story } from "@/components/home/Sections";
import { RecentlyViewed } from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBusiness();
  // Brand searches ("oolu", "oolu clothing") match the start of the title best.
  return pageMeta({
    path: "/",
    title: `${b.name} Clothing | Amsterdam Streetwear – T-shirts, Tanks & Tracksuits`,
    absoluteTitle: true,
    description: `${b.name} Clothing: streetwear rooted in Africa, created in Amsterdam. Shop the official ${b.name} T-shirts, tanks and tracksuits, with free shipping over €${Math.round(b.freeShippingThreshold / 100)}.`,
  });
}

export default async function HomePage() {
  const { t, locale } = await getT();
  const [featured, all, drops, ratings, settings] = await Promise.all([
    getFeaturedProducts(8),
    getProducts(),
    getUpcomingDrops(),
    getRatingsMap(),
    getSettings(),
  ]);

  const dropIds = new Set(drops.map((d) => d.id));
  const live = all.filter((p) => !dropIds.has(p.id));
  // New collection = the batch added most recently (within 3 days of the newest product).
  // If that's most of the shop (e.g. a first import), there's no "new" batch to show.
  const newest = live.reduce((m, p) => Math.max(m, p.createdAt || 0), 0);
  const batch = live.filter((p) => p.createdAt && newest - p.createdAt < 3 * 86_400_000).sort((a, b) => b.createdAt - a.createdAt);
  const newCollection = batch.length <= 8 && batch.length < live.length / 2 ? batch : [];
  const shown = new Set(newCollection.map((p) => p.id));
  // Featured = exactly what's ticked "Featured" in the admin (minus what the new collection already shows).
  const featuredRow = live.filter((p) => p.featured && !shown.has(p.id)).slice(0, 8);
  for (const p of featuredRow) shown.add(p.id);
  const newIn = live.filter((p) => p.isNew && !shown.has(p.id)).slice(0, 8);
  const onSale = all.filter(isOnSale).slice(0, 4);
  const counts: Record<string, number> = {};
  for (const p of all) counts[p.category] = (counts[p.category] ?? 0) + 1;

  // Admin-edited copy is shown as written; the built-in defaults are translated.
  const banner = {
    ...settings.dropBanner,
    eyebrow: settings.dropBanner.eyebrow === DEFAULT_SETTINGS.dropBanner.eyebrow ? t("drop.eyebrow") : settings.dropBanner.eyebrow,
    title: settings.dropBanner.title === DEFAULT_SETTINGS.dropBanner.title ? t("drop.title") : settings.dropBanner.title,
    body: settings.dropBanner.body === DEFAULT_SETTINGS.dropBanner.body ? t("drop.body") : settings.dropBanner.body,
  };
  const promo = settings.announcement === DEFAULT_SETTINGS.announcement ? t("promo.text") : settings.announcement;
  const nextDrop = drops[0];
  const launchAt = banner.launchAt ? Date.parse(banner.launchAt) : (nextDrop?.releaseAt ?? null);
  const showBanner = banner.enabled && launchAt != null && launchAt > nowMs();
  const holiday = holidayActive(settings, nowMs()) ? { title: settings.holiday.title, message: settings.holiday.message } : null;

  return (
    <>
      <Hero promo={promo} holiday={holiday} />
      {/* Next drop sits right under the hero so the countdown is the first thing after it. */}
      {showBanner && (
        <DropBanner
          eyebrow={banner.eyebrow}
          title={banner.launchAt ? banner.title : (nextDrop?.name ?? banner.title)}
          body={banner.body}
          launchAt={launchAt!}
          href={banner.launchAt || !nextDrop ? banner.href : `/products/${nextDrop.slug}`}
          image="/images/brand/drop-portrait.jpg"
        />
      )}
      <NewCollection products={newCollection} ratings={ratings} />
      <ProductRow title={t("home.featured")} products={featuredRow} href="/shop" ratings={ratings} />
      {/* Without any new or featured products the homepage still shows a row of products */}
      <ProductRow title={t("home.newArrivals")} products={newIn.length >= 4 ? newIn : featuredRow.length || newCollection.length ? newIn : featured} href="/shop?sort=new" ratings={ratings} />
      {holiday && <GiftBand />}
      <CategoryTiles counts={counts} />
      <Story />
      <Features />
      {onSale.length >= 4 && <ProductRow title={t("home.onSale")} products={onSale} href="/shop?sale=1" ratings={ratings} />}
      {/* The "OOLU means trust" story already has its own section above. */}
      <SocialFeed />
      <JournalTeaser posts={latestPosts(3, locale).filter((p) => p.slug !== "oolu-means-trust").slice(0, 2)} />
      <RecentlyViewed />
      <NewsletterBand percentOff={settings.popup.percentOff} />
    </>
  );
}
