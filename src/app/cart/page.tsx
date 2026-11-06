import type { Metadata } from "next";
import { shippingConfig } from "@/lib/shipping";
import { CartView } from "./CartView";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Your bag" };

export default async function CartPage() {
  const { t } = await getT();
  return (
    <div className="container-x py-12">
      <h1 className="mb-8 font-display font-normal tracking-[-0.02em] text-4xl">{t("cart.title")}</h1>
      <CartView freeShippingThreshold={shippingConfig().freeShippingThreshold} />
    </div>
  );
}
