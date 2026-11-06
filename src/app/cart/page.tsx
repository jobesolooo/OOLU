import type { Metadata } from "next";
import { shippingConfig } from "@/lib/shipping";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <div className="container-x py-12">
      <h1 className="mb-8 font-display font-normal tracking-[-0.02em] text-4xl">Your bag</h1>
      <CartView freeShippingThreshold={shippingConfig().freeShippingThreshold} />
    </div>
  );
}
