import { getFeaturedProducts } from "@/lib/catalog";
import { Hero } from "@/components/home/Hero";
import { CategoryTiles, FeaturedProducts, FreshDrops, Perks } from "@/components/home/Sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts(5);
  return (
    <>
      <Hero />
      <CategoryTiles />
      <FreshDrops />
      <Perks />
      <FeaturedProducts products={featured} />
    </>
  );
}
