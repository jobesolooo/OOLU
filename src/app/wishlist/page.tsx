import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="Wishlist" />
      <div className="container-x section-y">
        <WishlistView />
      </div>
    </>
  );
}
