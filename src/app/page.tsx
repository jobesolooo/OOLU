import { getFeaturedProducts, getProducts, getUpcomingDrops, isOnSale } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { getT } from "@/i18n/server";
import { latestPosts } from "@/content/journal";
import { nowMs } from "@/lib/time";
import { Hero } from "@/components/home/Hero";
import { CategoryTiles, DropBanner, Features, JournalTeaser, NewsletterBand, ProductRow, Story } from "@/components/home/Sections";
import { RecentlyViewed } from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

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
  const newIn = all.filter((p) => p.isNew && !dropIds.has(p.id)).slice(0, 8);
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

  return (
    <>
      <Hero promo={promo} />
      <ProductRow title={t("home.newArrivals")} products={newIn.length >= 4 ? newIn : featured} href="/shop?sort=new" ratings={ratings} />
      <CategoryTiles counts={counts} />
      <Story />
      <Features />
      {showBanner && (
        <DropBanner
          eyebrow={banner.eyebrow}
          title={banner.launchAt ? banner.title : (nextDrop?.name ?? banner.title)}
          body={banner.body}
          launchAt={launchAt!}
          href={banner.launchAt || !nextDrop ? banner.href : `/products/${nextDrop.slug}`}
          image="/images/brand/tracksuit-duo-2.jpg"
        />
      )}
      {onSale.length >= 4 && <ProductRow title={t("home.onSale")} products={onSale} href="/shop?sale=1" ratings={ratings} />}
      <JournalTeaser posts={latestPosts(3, locale)} />
      <RecentlyViewed />
      <NewsletterBand percentOff={settings.popup.percentOff} />
    </>
  );
}
