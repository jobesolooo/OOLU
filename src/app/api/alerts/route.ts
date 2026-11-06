import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductById } from "@/lib/catalog";
import { createStockAlert } from "@/lib/alerts";

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
  productId: z.string().min(1).max(100),
  size: z.string().max(40).default(""),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const product = await getProductById(parsed.data.productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  await createStockAlert(parsed.data.email, product.id, parsed.data.size);
  return NextResponse.json({ ok: true });
}
