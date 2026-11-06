import type { Metadata } from "next";
import { shippingConfig } from "@/lib/shipping";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <div className="container-x py-12">
      <h1 className="mb-8 font-display text-4xl font-[900] uppercase">Your bag</h1>
      <CartView freeShippingThreshold={shippingConfig().freeShippingThreshold} />
    </div>
  );
}
