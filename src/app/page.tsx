import { getFeaturedProducts, getProducts, getUpcomingDrops, isOnSale } from "@/lib/catalog";
import { getRatingsMap } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";
import { latestPosts } from "@/content/journal";
import { nowMs } from "@/lib/time";
import { Hero } from "@/components/home/Hero";
import {
  CategoryTiles,
  DropBanner,
  FreshDrops,
  JournalTeaser,
  NewsletterBand,
  Perks,
  ProductRow,
} from "@/components/home/Sections";
import { RecentlyViewed } from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, all, drops, ratings, settings] = await Promise.all([
    getFeaturedProducts(5),
    getProducts(),
    getUpcomingDrops(),
    getRatingsMap(),
    getSettings(),
  ]);

  const dropIds = new Set(drops.map((d) => d.id));
  const newIn = all.filter((p) => p.isNew && !dropIds.has(p.id)).slice(0, 5);
  const onSale = all.filter(isOnSale).slice(0, 5);

  const banner = settings.dropBanner;
  const nextDrop = drops[0];
  const launchAt = banner.launchAt ? Date.parse(banner.launchAt) : (nextDrop?.releaseAt ?? null);
  const showBanner = banner.enabled && launchAt != null && launchAt > nowMs();

  return (
    <>
      <Hero />
      <CategoryTiles />
      <FreshDrops />
      <Perks />
      <ProductRow title="Featured products" products={featured} ratings={ratings} />
      {showBanner && (
        <DropBanner
          eyebrow={banner.eyebrow}
          title={banner.launchAt ? banner.title : (nextDrop?.name ?? banner.title)}
          body={banner.body}
          launchAt={launchAt!}
          href={banner.launchAt || !nextDrop ? banner.href : `/products/${nextDrop.slug}`}
          image={"/images/tile-new.jpg"}
        />
      )}
      {newIn.length >= 3 && <ProductRow title="New in" products={newIn} href="/shop?sort=new" ratings={ratings} />}
      {onSale.length >= 3 && <ProductRow title="On sale" products={onSale} href="/shop?sale=1" ratings={ratings} />}
      <JournalTeaser posts={latestPosts(3)} />
      <RecentlyViewed />
      <NewsletterBand percentOff={settings.popup.percentOff} />
    </>
  );
}
