import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { WishlistView } from "./WishlistView";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("wishlist.eyebrow")} title={t("wishlist.title")} />
      <div className="container-x section-y">
        <WishlistView />
      </div>
    </>
  );
}
