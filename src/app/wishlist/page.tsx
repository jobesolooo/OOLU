import { redirect } from "next/navigation";

/** The wishlist lives in the account area now; old links and bookmarks land there. */
export default function WishlistRedirect() {
  redirect("/account/wishlist");
}
