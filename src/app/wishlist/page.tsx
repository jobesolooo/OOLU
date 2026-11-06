import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { WishlistView } from "./WishlistView";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("wishlist.eyebrow")} title={t("wishlist.title")} subtitle={t("wishlist.subtitle")} image="/images/brand/tracksuit-duo-2.jpg" imagePosition="center 30%" word="SAVED" />
      <div className="container-x py-[clamp(40px,5vw,80px)]">
        <WishlistView />
      </div>
    </>
  );
}
