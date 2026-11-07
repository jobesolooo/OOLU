import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { WishlistView } from "@/app/wishlist/WishlistView";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.wishlist"), robots: { index: false } };
}

export default async function AccountWishlistPage() {
  // Saved pieces belong to an account; guests are sent to sign in with a short note.
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?reason=wishlist&next=%2Faccount%2Fwishlist");
  const { t } = await getT();
  return (
    <AccountShell user={user} active="wishlist" title={t("ac.nav.wishlist")}>
      <AccountSection n={1} title={t("wishlist.title")} sub={t("wishlist.subtitle")}>
        <WishlistView />
      </AccountSection>
    </AccountShell>
  );
}
